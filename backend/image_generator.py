"""
TEXO Multi-Source 4K Visual & Contextual AI Image Studio (v7.0)
===============================================================
- Multi-Source Parallel Image Engine:
  Simultaneously queries and ranks the best high-resolution images from:
  1. Wallhaven 4K/8K Ultra-HD Curated API
  2. Bing Ultra-HD Large/Wallpaper Visual Engine (`/images/async` with size filter)
  3. Lexica Aperture Photorealistic AI Art Engine
  4. Yahoo High-Resolution Image Index
  5. OpenAI GPT-Image / Google Gemini Imagen / Pollinations FLUX AI Synthesis
- Contextual Follow-Up & Short-Word Learning (`data/memory/image_memory.json`):
  Understands 1-to-4 word follow-ups like "do it better", "better", "another",
  "black suit", "add iron man", "in rain", "at night", "more realistic",
  accumulating modifiers onto the active subject and never repeating seen URLs.
"""
from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import io
import json
import logging
import os
import random
import re
import threading
import time
import urllib.parse
import uuid

import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw

load_dotenv()

logger = logging.getLogger("apex.image_generator")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_IMG_DIR = os.path.join(BASE_DIR, "frontend", "static", "generated_images")
MEMORY_DIR = os.path.join(BASE_DIR, "data", "memory")
IMAGE_MEMORY_FILE = os.path.join(MEMORY_DIR, "image_memory.json")
os.makedirs(STATIC_IMG_DIR, exist_ok=True)
os.makedirs(MEMORY_DIR, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

PROMPT_DIRECTOR_MODELS = [
    m for m in [
        os.getenv("GEMINI_MODEL", ""),
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
    ] if m
]

GEMINI_IMAGE_MODELS = [
    m for m in [
        os.getenv("GEMINI_IMAGE_MODEL", ""),
        "gemini-2.5-flash-image",
        "gemini-3.1-flash-image",
    ] if m
]

_SESSION = requests.Session()
_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_DISABLED_UNTIL: dict[str, float] = {}
_DISABLED_LOCK = threading.Lock()
_MEMORY_LOCK = threading.Lock()


def _is_disabled(name: str) -> bool:
    with _DISABLED_LOCK:
        return _DISABLED_UNTIL.get(name, 0) > time.time()


def _disable(name: str, seconds: int) -> None:
    with _DISABLED_LOCK:
        _DISABLED_UNTIL[name] = time.time() + seconds


# ══════════════════════════════════════════════════════════════════════════════
# 1. PERSISTENT CONTEXTUAL IMAGE MEMORY & FOLLOW-UP LEARNING
# ══════════════════════════════════════════════════════════════════════════════
def _load_image_memory() -> dict:
    with _MEMORY_LOCK:
        if os.path.exists(IMAGE_MEMORY_FILE):
            try:
                with open(IMAGE_MEMORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        return data
            except Exception:
                pass
        return {
            "base_subject": "",
            "modifiers": [],
            "style_preferences": [],
            "call_idx": 0,
            "seen_urls": [],
            "seen_hashes": [],
            "history": [],
            "updated_at": 0,
        }


def _save_image_memory(mem: dict) -> None:
    with _MEMORY_LOCK:
        try:
            mem["updated_at"] = time.time()
            mem["seen_urls"] = mem.get("seen_urls", [])[-80:]
            mem["seen_hashes"] = mem.get("seen_hashes", [])[-80:]
            mem["history"] = mem.get("history", [])[-30:]
            with open(IMAGE_MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump(mem, f, indent=2)
        except Exception as e:
            logger.debug("Failed saving image memory: %s", e)


# Patterns for short follow-up requests ("do it better", "add venom", "in rain", etc.)
_BETTER_FOLLOWUP_RE = re.compile(
    r"^\s*(?:please\s+|pls\s+|can you\s+|try\s+|make\s+it\s+|do\s+it\s+|give\s+me\s+|show\s+me\s+)?"
    r"(?:better|do it better|make it better|more better|best|improve|improve it|enhance|enhance it|"
    r"upgrade|more realistic|realistic|ultra realistic|hyper realistic|more hd|hd|4k|8k|ultra hd|"
    r"clearer|sharper|high quality|higher quality|best quality|another|another one|one more|"
    r"next|next one|again|try again|regenerate|different|something different|different angle|"
    r"different style|change|change it|not good|vague|blurry|bad|aur acha|acha banao|aur dikhao|"
    r"more detailed|cinematic)\s*[.!?]*$",
    re.IGNORECASE,
)

_ADD_MODIFIER_PREFIX_RE = re.compile(
    r"^\s*(?:please\s+|can you\s+|now\s+|also\s+)?"
    r"(?:add|include|put|with|in|on|at|under|near|beside|wearing|holding|fighting|versus|vs|"
    r"make\s+(?:it|him|her|the\s+\w+|this)|change\s+(?:the\s+)?(?:background|color|colour|suit|style|setting|lighting)\s+to|"
    r"change\s+to|turn\s+into|set\s+in|show\s+(?:him|her|it)\s+(?:in|on|with|at))\s+(.+)$",
    re.IGNORECASE,
)

_STYLE_KEYWORDS = {
    "realistic": "photorealistic 8K",
    "cinematic": "cinematic movie lighting",
    "dark": "dark moody atmosphere",
    "night": "at night neon city lights",
    "rain": "in heavy rain dramatic reflections",
    "anime": "anime key visual art style",
    "3d": "Unreal Engine 5 3D render",
    "cyberpunk": "cyberpunk neon aesthetic",
    "vintage": "vintage film photography",
    "closeup": "extreme close-up portrait",
    "close up": "extreme close-up portrait",
    "full body": "full body dynamic action shot",
}

_COMMAND_RE = re.compile(
    r"^\s*(?:hey\s+|hi\s+)?(?:texo[,\s]+)?(?:can you |could you |would you |please |pls |kindly |i want (?:you to )?|i need |i'd like )*"
    r"(?:to\s+)?(?:generate|create|make|draw|paint|render|design|produce|show(?: me)?|give(?: me)?|send(?: me)?|find|get|imagine|provide)\s+"
    r"(?:me\s+)?(?:an?\s+|the\s+|some\s+)?",
    re.IGNORECASE,
)
_MEDIA_WORDS = (
    r"(?:photo|photograph|picture|pic|image|img|illustration|drawing|sketch|"
    r"painting|render|art|artwork|wallpaper|poster|portrait|shot|visual|graphic)s?"
)


def clean_image_prompt(prompt: str) -> str:
    p = re.sub(r"```.*?```", " ", prompt or "", flags=re.DOTALL)
    p = re.sub(r"\[.*?\]\(.*?\)", " ", p)
    p = re.sub(r"https?://\S+", " ", p)
    p = re.sub(r"[#*_>`]", " ", p)
    p = re.sub(r"\s+", " ", p).strip()
    return p[:500]


def _normalize_hero_names(s: str) -> str:
    low = s.lower().strip()
    hero_aliases = {
        "spiderman": "Spider-Man",
        "spidermna": "Spider-Man",
        "spidermn": "Spider-Man",
        "spideman": "Spider-Man",
        "spider man": "Spider-Man",
        "spidey": "Spider-Man",
        "ironman": "Iron Man",
        "ironmna": "Iron Man",
        "batman": "Batman",
        "batmna": "Batman",
        "superman": "Superman",
        "supermna": "Superman",
        "captain america": "Captain America",
        "deadpool": "Deadpool",
        "wolverine": "Wolverine",
        "thor": "Thor Marvel",
        "hulk": "Incredible Hulk",
        "venom": "Venom Marvel",
        "naruto": "Naruto Uzumaki",
        "goku": "Goku Dragon Ball",
    }
    if low in hero_aliases:
        return hero_aliases[low]
    for k, v in hero_aliases.items():
        if re.search(rf"\b{re.escape(k)}\b", low):
            s = re.sub(rf"\b{re.escape(k)}\b", v, s, flags=re.IGNORECASE)
            break
    return s


def extract_clean_subject(text: str) -> str:
    """
    Extract pure subject from any phrasing:
    'make the photo of spiderman' -> 'Spider-Man'
    'spiderman photo generation' -> 'Spider-Man'
    """
    if not text:
        return ""
    s = clean_image_prompt(text)
    # Strip boilerplate wrapper added by frontend buildPhotorealisticPrompt if present
    s = re.sub(
        r"^high quality (?:realistic industrial|cinematic realistic) photograph of\s+",
        "",
        s,
        flags=re.IGNORECASE,
    )
    s = re.sub(
        r",\s*(?:professional photography|8k resolution|8k uhd).*$",
        "",
        s,
        flags=re.IGNORECASE,
    )

    for _ in range(4):
        prev = s
        s = _COMMAND_RE.sub("", s)
        s = re.sub(
            rf"^(?:an?\s+|the\s+)?(?:\w+\s+)?{_MEDIA_WORDS}\s+(?:generation\s+)?(?:of|about|for|showing|with)\s+(?:an?\s+|the\s+)?",
            "",
            s,
            flags=re.IGNORECASE,
        )
        s = re.sub(rf"^{_MEDIA_WORDS}\s+(?:generation\s+)?(?:of\s+|for\s+)?", "", s, flags=re.IGNORECASE)
        s = re.sub(
            rf"\s+(?:{_MEDIA_WORDS}|generation|generator|creation|synthesis|making|request)s?$",
            "",
            s,
            flags=re.IGNORECASE,
        )
        if s == prev:
            break

    s = re.sub(r"\s+(?:banao|bana do|chahiye|dikhao)$", "", s, flags=re.IGNORECASE)
    s = re.sub(r"^(?:an?\s+|the\s+|of\s+|for\s+)", "", s, flags=re.IGNORECASE)
    s = s.strip(" ?!.,;:")
    return _normalize_hero_names(s)


def resolve_contextual_subject(raw_user_q: str, fallback_prompt: str, base_subject_hint: str = "") -> tuple[str, list[str], int, bool]:
    """
    Resolves the user's request against persistent image memory (`image_memory.json`).
    Supports:
    - Brand-new subjects ("make the photo of spiderman")
    - Single-word / short quality follow-ups ("do it better", "better", "another", "4k")
    - Short additive modifications ("black suit", "add iron man", "in rain", "at night")
    Returns: (effective_subject, modifiers_list, call_idx, is_followup)
    """
    mem = _load_image_memory()
    remembered_base = base_subject_hint.strip() or mem.get("base_subject", "").strip()
    remembered_mods: list[str] = list(mem.get("modifiers", []))
    call_idx = int(mem.get("call_idx", 0))

    q = (raw_user_q or fallback_prompt or "").strip()
    q_clean = re.sub(r"[?!.,;:]+$", "", q).strip()

    # 1. Check if it's a "do it better" / "another" / "more realistic" quality follow-up
    if remembered_base and _BETTER_FOLLOWUP_RE.match(q_clean):
        call_idx += 1
        # Learn any style preference mentioned in the follow-up
        q_low = q_clean.lower()
        for kw, style_desc in _STYLE_KEYWORDS.items():
            if kw in q_low and style_desc not in remembered_mods:
                remembered_mods.append(style_desc)
        mem["base_subject"] = remembered_base
        mem["modifiers"] = remembered_mods[-4:]
        mem["call_idx"] = call_idx
        mem.setdefault("history", []).append({"q": q, "resolved": f"{remembered_base} {' '.join(remembered_mods)}".strip(), "type": "better"})
        _save_image_memory(mem)
        full_subj = f"{remembered_base} {' '.join(remembered_mods)}".strip()
        return full_subj, remembered_mods, call_idx, True

    # 2. Check if it's an explicit modification ("add iron man", "with venom", "in black suit", "make it dark")
    mod_match = _ADD_MODIFIER_PREFIX_RE.match(q_clean)
    if remembered_base and mod_match:
        new_mod = extract_clean_subject(mod_match.group(1)) or mod_match.group(1).strip()
        new_mod = re.sub(r"\b(?:to\s+(?:the|this|existing)\s+(?:image|photo|picture)|to\s+it)\b", "", new_mod, flags=re.IGNORECASE).strip()
        if new_mod and new_mod.lower() not in [m.lower() for m in remembered_mods]:
            remembered_mods.append(new_mod)
        call_idx += 1
        mem["base_subject"] = remembered_base
        mem["modifiers"] = remembered_mods[-4:]
        mem["call_idx"] = call_idx
        mem.setdefault("history", []).append({"q": q, "resolved": f"{remembered_base} {' '.join(remembered_mods)}".strip(), "type": "modify"})
        _save_image_memory(mem)
        full_subj = f"{remembered_base} {' '.join(remembered_mods)}".strip()
        return full_subj, remembered_mods, call_idx, True

    # 3. Extract clean subject from query
    extracted = extract_clean_subject(q_clean)

    # What if the user typed a short 1-4 word descriptor without "photo of" right after generating an image?
    # e.g., "black suit", "at night", "in rain", "red and gold", "fighting venom", "full body"
    word_count = len(q_clean.split())
    has_explicit_photo_word = bool(re.search(rf"\b{_MEDIA_WORDS}\b", q_clean, flags=re.IGNORECASE))
    if remembered_base and not has_explicit_photo_word and 1 <= word_count <= 5:
        # Check if it's a modifier rather than a completely new famous character
        is_modifier_phrase = bool(
            re.search(
                r"\b(suit|costume|armor|armour|rain|night|dark|neon|city|sky|flying|fighting|pose|action|"
                r"background|style|colour|color|red|blue|black|gold|white|green|glowing|fire|lightning|"
                r"snow|space|rooftop|bridge|close\s*up|full\s*body|portrait|3d|anime|cyberpunk|better|more|less)\b",
                q_clean,
                flags=re.IGNORECASE,
            )
        )
        if is_modifier_phrase and REMEMBERED_NOT_IN_QUERY(remembered_base, q_clean):
            mod_text = extracted or q_clean
            if mod_text.lower() not in [m.lower() for m in remembered_mods]:
                remembered_mods.append(mod_text)
            call_idx += 1
            mem["base_subject"] = remembered_base
            mem["modifiers"] = remembered_mods[-4:]
            mem["call_idx"] = call_idx
            _save_image_memory(mem)
            full_subj = f"{remembered_base} {' '.join(remembered_mods)}".strip()
            return full_subj, remembered_mods, call_idx, True

    # 4. If extracted subject is generic ("it", "better", "this", "same", ""), fall back to remembered_base
    if remembered_base and (not extracted or extracted.lower() in ("it", "this", "that", "same", "better", "another", "more", "existing", "existing image")):
        call_idx += 1
        mem["call_idx"] = call_idx
        _save_image_memory(mem)
        full_subj = f"{remembered_base} {' '.join(remembered_mods)}".strip()
        return full_subj, remembered_mods, call_idx, True

    # 5. Brand-new subject (or repeated request for the same subject)
    final_subj = extracted if len(extracted) >= 2 else (remembered_base or "Spider-Man")
    if final_subj.lower() == remembered_base.lower():
        call_idx += 1
    else:
        call_idx = 0
        remembered_mods = []

    mem["base_subject"] = final_subj
    mem["modifiers"] = remembered_mods
    mem["call_idx"] = call_idx
    mem.setdefault("history", []).append({"q": q, "resolved": final_subj, "type": "new"})
    _save_image_memory(mem)
    full_subj = f"{final_subj} {' '.join(remembered_mods)}".strip()
    return full_subj, remembered_mods, call_idx, False


def REMEMBERED_NOT_IN_QUERY(remembered_base: str, query: str) -> bool:
    rb = remembered_base.lower().replace("-", " ")
    ql = query.lower().replace("-", " ")
    return rb not in ql


def detect_aspect(text: str, subject: str = "") -> str:
    t = f"{text or ''} {subject or ''}".lower()
    if re.search(r"\b(square|1:1|logo|icon|avatar)\b", t):
        return "1:1"
    if re.search(r"\b(portrait|vertical|wallpaper|poster|spider|iron man|batman|superman|hero|character)\b", t):
        return "3:4"
    return "16:9"


def _build_smart_search_query(subject: str, is_followup: bool = False) -> str:
    """
    Build a hyphen-safe, ultra-relevant 4K search query.
    Never include '-word' (like 'Spider-Man'), because search engines parse '-Man' as NOT Man.
    """
    sub_low = subject.lower()
    safe_sub = re.sub(r"spider[\s\-]*man", "Spiderman", subject, flags=re.IGNORECASE)
    safe_sub = safe_sub.replace("-", " ")
    safe_sub = re.sub(r"\s+", " ", safe_sub).strip()

    if any(h in sub_low for h in ["spider", "iron man", "batman", "superman", "deadpool", "wolverine", "thor", "hulk", "venom", "avengers", "marvel"]):
        return f"{safe_sub} Marvel movie 4K Ultra HD wallpaper poster"
    if any(a in sub_low for a in ["naruto", "goku", "luffy", "anime", "gojo", "demon slayer"]):
        return f"{safe_sub} anime 4K Ultra HD wallpaper official art"
    if any(m in sub_low for m in ["loom", "weaving", "spinning", "stenter", "dyeing", "textile", "fabric", "yarn", "factory", "machine"]):
        return f"{safe_sub} industrial textile machinery high resolution photograph"
    if any(c in sub_low for c in ["car", "lamborghini", "ferrari", "porsche", "bugatti", "bmw", "mercedes", "mustang", "bike"]):
        return f"{safe_sub} supercar automotive photography 4K Ultra HD wallpaper"
    return f"{safe_sub} 4K Ultra HD high resolution photograph"


def _claude_or_gemini_direct_query(subject: str, user_q: str) -> tuple[str, str] | None:
    """
    Use Claude API (ANTHROPIC_API_KEY) or Gemini API (GEMINI_API_KEY)
    to craft the optimal (search_query, concise_ai_prompt).
    """
    instruction = (
        f"User wants a high-resolution image of: \"{subject}\" (Request: \"{user_q}\").\n"
        "Return ONLY valid JSON with two keys:\n"
        "1. \"search_query\": A 4 to 8 word high-resolution 4K image search query for this exact subject and modifiers. "
        "NEVER use hyphens (write Spiderman not Spider-Man).\n"
        "2. \"ai_prompt\": A single vivid sentence (under 140 characters) describing this exact scene for an AI image generator."
    )

    if ANTHROPIC_API_KEY and not ANTHROPIC_API_KEY.startswith("sk-ant-xxxx") and not _is_disabled("claude:director"):
        try:
            r = _SESSION.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5"),
                    "max_tokens": 160,
                    "messages": [{"role": "user", "content": instruction}],
                },
                timeout=5,
            )
            if r.status_code == 200:
                txt = r.json().get("content", [{}])[0].get("text", "")
                m = re.search(r"\{.*\}", txt, flags=re.DOTALL)
                if m:
                    data = json.loads(m.group(0))
                    sq = data.get("search_query", "").replace("-", " ").strip()
                    ap = data.get("ai_prompt", "").strip()
                    if sq and ap:
                        return sq, ap
            elif r.status_code in (401, 403, 404):
                _disable("claude:director", 3600)
        except Exception:
            pass

    if GEMINI_API_KEY:
        for model in PROMPT_DIRECTOR_MODELS:
            if _is_disabled(f"text:{model}"):
                continue
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
                r = _SESSION.post(
                    url,
                    json={
                        "contents": [{"role": "user", "parts": [{"text": instruction}]}],
                        "generationConfig": {"maxOutputTokens": 150, "temperature": 0.25},
                    },
                    timeout=4,
                )
                if r.status_code == 200:
                    parts = r.json().get("candidates", [{}])[0].get("content", {}).get("parts", [])
                    txt = "".join(p.get("text", "") for p in parts)
                    m = re.search(r"\{.*\}", txt, flags=re.DOTALL)
                    if m:
                        data = json.loads(m.group(0))
                        sq = data.get("search_query", "").replace("-", " ").strip()
                        ap = data.get("ai_prompt", "").strip()
                        if sq and ap:
                            return sq, ap
                elif r.status_code in (400, 403, 404):
                    _disable(f"text:{model}", 3600)
                elif r.status_code == 429:
                    _disable(f"text:{model}", 60)
            except Exception:
                pass

    return None


# ══════════════════════════════════════════════════════════════════════════════
# 2. MULTI-SOURCE PARALLEL 4K IMAGE HARVESTERS
#    (Wallhaven 4K API + Bing Ultra-HD Filter + Lexica AI + Yahoo HD)
# ══════════════════════════════════════════════════════════════════════════════
_BAD_URL_TOKENS = (
    "bilibili.com", "tiktok.com", "fbsbx.com", "svg", "icon", "logo",
    "toy", "brick", "trebl", "lego", "ebay", "aliexpress", "etsy", "cosplay",
    "costume", "partycity", "walmart", "target.com", "wish.com", "temu.com",
    "merch", "tshirt", "mug", "keychain", "plush", "diaper", "cake",
)


def _is_clean_candidate_url(url: str, subject: str) -> bool:
    low = url.lower()
    sub_low = subject.lower()
    for bad in _BAD_URL_TOKENS:
        if bad in low and bad not in sub_low:
            return False
    return True


def _source_wallhaven_4k(subject: str, search_query: str) -> list[tuple[str, str, int]]:
    """
    Source 1: Wallhaven 4K/8K Ultra-HD Wallpaper API (Public JSON, sorted by favorites).
    Returns list of (image_url, source_label, priority_score).
    """
    results: list[tuple[str, str, int]] = []
    clean_sub = re.sub(r"spider[\s\-]*man", "Spider-Man", subject, flags=re.IGNORECASE)
    # Strip generic words like '4K', 'wallpaper', 'photo' for Wallhaven tag search
    wh_q = re.sub(r"\b(4k|8k|hd|ultra|wallpaper|poster|photograph|photo|high|resolution)\b", "", clean_sub, flags=re.IGNORECASE).strip()
    if not wh_q:
        wh_q = clean_sub
    try:
        url = (
            f"https://wallhaven.cc/api/v1/search?q={urllib.parse.quote(wh_q)}"
            "&categories=110&purity=100&sorting=favorites&order=desc"
        )
        r = _SESSION.get(url, headers=_BROWSER_HEADERS, timeout=4.5)
        if r.status_code == 200:
            items = r.json().get("data", [])
            for idx, item in enumerate(items[:10]):
                path = item.get("path")
                res_x = int(item.get("dimension_x", 0))
                res_y = int(item.get("dimension_y", 0))
                if path and res_x >= 1280 and res_y >= 720 and _is_clean_candidate_url(path, subject):
                    results.append((path, f"Wallhaven 4K ({res_x}×{res_y})", 98 - idx))
    except Exception as e:
        logger.debug("Wallhaven 4K source note: %s", e)
    return results


def _source_bing_ultra_hd(subject: str, search_query: str) -> list[tuple[str, str, int]]:
    """
    Source 2: Bing Async Ultra-HD Large Image Grid (`imagesize-large` filter).
    Returns list of (image_url, source_label, priority_score).
    """
    results: list[tuple[str, str, int]] = []
    safe_q = re.sub(r"spider[\s\-]*man", "Spiderman", search_query, flags=re.IGNORECASE).replace("-", " ")
    try:
        # Use %2Bfilterui:imagesize-large so Bing strictly returns high-resolution images
        url = (
            f"https://www.bing.com/images/async?q={urllib.parse.quote(safe_q)}"
            "&first=0&count=30&qft=%2Bfilterui:imagesize-large&mmasync=1"
        )
        r = _SESSION.get(url, headers=_BROWSER_HEADERS, timeout=5.0)
        if r.status_code == 200:
            murls = re.findall(
                r"murl&quot;:&quot;(https?://[^&]+?\.(?:jpg|jpeg|png|webp))&quot;",
                r.text,
                flags=re.IGNORECASE,
            )
            for idx, u in enumerate(murls[:16]):
                if _is_clean_candidate_url(u, subject):
                    results.append((u, "Bing 4K Ultra-HD", 95 - idx))
    except Exception as e:
        logger.debug("Bing Ultra-HD source note: %s", e)
    return results


def _source_lexica_ai_art(subject: str, ai_prompt: str) -> list[tuple[str, str, int]]:
    """
    Source 3: Lexica Aperture Photorealistic AI Art Search Engine.
    Great for creative modifiers ("Spider-Man in rain neon cyberpunk", "Spider-Man black suit").
    """
    results: list[tuple[str, str, int]] = []
    q = subject if len(subject) <= 80 else ai_prompt[:80]
    try:
        url = f"https://lexica.art/api/v1/search?q={urllib.parse.quote(q)}"
        r = _SESSION.get(url, headers=_BROWSER_HEADERS, timeout=4.5)
        if r.status_code == 200:
            images = r.json().get("images", [])
            for idx, item in enumerate(images[:10]):
                src = item.get("src")
                w = int(item.get("width", 1024))
                h = int(item.get("height", 1024))
                if src and w >= 512 and h >= 512:
                    results.append((src, "Lexica Aperture AI", 92 - idx))
    except Exception as e:
        logger.debug("Lexica AI source note: %s", e)
    return results


def _source_yahoo_hd(subject: str, search_query: str) -> list[tuple[str, str, int]]:
    """
    Source 4: Yahoo High-Resolution Image Search (`imgsz=large`).
    Independent search index providing diverse high-res photography.
    """
    results: list[tuple[str, str, int]] = []
    safe_q = re.sub(r"spider[\s\-]*man", "Spiderman", search_query, flags=re.IGNORECASE).replace("-", " ")
    try:
        url = (
            f"https://images.search.yahoo.com/search/images?p={urllib.parse.quote(safe_q)}"
            "&imgsz=large"
        )
        r = _SESSION.get(url, headers=_BROWSER_HEADERS, timeout=4.5)
        if r.status_code == 200:
            raw_urls = re.findall(r'"iurl"\s*:\s*"(https?:[^"]+)"', r.text)
            for idx, raw_u in enumerate(raw_urls[:12]):
                clean_u = raw_u.replace("\\/", "/")
                if _is_clean_candidate_url(clean_u, subject):
                    results.append((clean_u, "Yahoo Ultra-HD Index", 89 - idx))
    except Exception as e:
        logger.debug("Yahoo HD source note: %s", e)
    return results


def fetch_best_multisource_hd_image(
    subject: str,
    search_query: str,
    ai_prompt: str,
    call_idx: int = 0,
    has_modifiers: bool = False,
) -> tuple[bytes, str] | None:
    """
    Queries Wallhaven 4K, Bing Ultra-HD, Lexica AI, and Yahoo HD in parallel,
    merges and ranks candidates across all sources, skips any previously seen URLs
    or image hashes, and downloads + validates the best high-res image.
    """
    mem = _load_image_memory()
    seen_urls = set(mem.get("seen_urls", []))
    seen_hashes = set(mem.get("seen_hashes", []))

    all_candidates: list[tuple[str, str, int]] = []

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [
            pool.submit(_source_wallhaven_4k, subject, search_query),
            pool.submit(_source_bing_ultra_hd, subject, search_query),
            pool.submit(_source_lexica_ai_art, subject, ai_prompt),
            pool.submit(_source_yahoo_hd, subject, search_query),
        ]
        for fut in as_completed(futures, timeout=5.5):
            try:
                res_list = fut.result()
                if res_list:
                    all_candidates.extend(res_list)
            except Exception:
                pass

    if not all_candidates:
        return None

    # Sort by priority score descending (interleaves top results from all 4 sources!)
    all_candidates.sort(key=lambda x: x[2], reverse=True)

    # Deduplicate while preserving interleaved multi-source ranking
    unique_candidates: list[tuple[str, str]] = []
    seen_in_batch: set[str] = set()
    unseen_first: list[tuple[str, str]] = []
    already_seen_backup: list[tuple[str, str]] = []

    for img_url, label, _score in all_candidates:
        if img_url in seen_in_batch:
            continue
        seen_in_batch.add(img_url)
        if img_url not in seen_urls:
            unseen_first.append((img_url, label))
        else:
            already_seen_backup.append((img_url, label))

    unique_candidates = unseen_first + already_seen_backup

    for img_url, source_label in unique_candidates[:14]:
        try:
            ir = _SESSION.get(img_url, headers=_BROWSER_HEADERS, timeout=4.5)
            ctype = ir.headers.get("content-type", "").lower()
            if ir.status_code == 200 and ctype.startswith("image/") and len(ir.content) > 24000:
                img_hash = hashlib.md5(ir.content[:16384]).hexdigest()
                if img_hash in seen_hashes and len(unseen_first) > 2:
                    continue
                with Image.open(io.BytesIO(ir.content)) as im:
                    w, h = im.size
                    if w < 450 or h < 380:
                        continue
                # Record URL and hash in memory so "do it better" never repeats it
                mem.setdefault("seen_urls", []).append(img_url)
                mem.setdefault("seen_hashes", []).append(img_hash)
                _save_image_memory(mem)
                logger.info(
                    "Multi-Source Visual Engine selected [%s] for '%s' (%dx%d, %d bytes)",
                    source_label, subject, w, h, len(ir.content),
                )
                return ir.content, source_label
        except Exception:
            continue

    return None


def generate_with_openai(prompt: str, aspect: str) -> tuple[bytes, str] | None:
    if not OPENAI_API_KEY or _is_disabled("img:openai"):
        return None
    size = {"1:1": "1024x1024", "16:9": "1536x1024", "3:4": "1024x1536"}.get(aspect, "1024x1024")
    try:
        r = _SESSION.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1"), "prompt": prompt, "size": size, "n": 1},
            timeout=35,
        )
        if r.status_code == 200:
            item = r.json().get("data", [{}])[0]
            if item.get("b64_json"):
                return base64.b64decode(item["b64_json"]), "OpenAI GPT-Image"
            if item.get("url"):
                img = _SESSION.get(item["url"], timeout=15)
                if img.ok:
                    return img.content, "OpenAI GPT-Image"
        elif r.status_code in (401, 403, 404, 429):
            _disable("img:openai", 3600)
    except Exception:
        pass
    return None


def generate_with_gemini(prompt: str, aspect: str) -> tuple[bytes, str] | None:
    if not GEMINI_API_KEY:
        return None
    for model in GEMINI_IMAGE_MODELS:
        if _is_disabled(f"img:{model}"):
            continue
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
        }
        try:
            r = _SESSION.post(url, json=body, timeout=14)
            if r.status_code == 200:
                for cand in r.json().get("candidates", []):
                    for part in cand.get("content", {}).get("parts", []):
                        inline = part.get("inlineData") or part.get("inline_data")
                        if inline and inline.get("data"):
                            data = base64.b64decode(inline["data"])
                            if len(data) > 10000:
                                return data, f"Gemini ({model})"
            elif r.status_code in (403, 404, 429):
                _disable(f"img:{model}", 3600)
        except Exception:
            pass
    return None


def generate_with_pollinations(prompt: str, aspect: str) -> tuple[bytes, str] | None:
    if _is_disabled("img:pollinations"):
        return None
    w, h = {"1:1": (1024, 1024), "3:4": (768, 1024), "16:9": (1024, 768)}.get(aspect, (1024, 768))
    short_prompt = prompt[:145].strip()
    encoded = urllib.parse.quote(short_prompt)
    seed = random.randint(100, 999999)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width={w}&height={h}&nologo=true&seed={seed}"
    try:
        r = _SESSION.get(url, timeout=14)
        ctype = r.headers.get("content-type", "")
        if r.status_code == 200 and ctype.startswith("image") and len(r.content) > 15000:
            return r.content, "FLUX AI Synthesis"
        if r.status_code == 402:
            _disable("img:pollinations", 45)
    except Exception:
        pass
    return None


# ══════════════════════════════════════════════════════════════════════════════
# 3. IMAGE OPTIMIZATION & OFFLINE FALLBACK CANVAS
# ══════════════════════════════════════════════════════════════════════════════
def optimize_and_save_image(raw_bytes: bytes, out_path: str) -> tuple[int, int]:
    with Image.open(io.BytesIO(raw_bytes)) as img:
        img = img.convert("RGB")
        img.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        img.save(out_path, format="JPEG", quality=93, optimize=True, progressive=True)
        return img.size


def generate_thematic_visual_poster(subject: str, description: str, filename: str) -> str:
    w, h = 1024, 768
    img = Image.new("RGB", (w, h), color=(18, 12, 4))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        shade = int(18 + 40 * (y / h))
        draw.line([(0, y), (w, y)], fill=(shade, int(shade * 0.65), 6))
    draw.rectangle([25, 25, w - 25, h - 25], outline=(251, 191, 36), width=2)
    draw.text((55, 52), "TEXO 4K VISUAL STUDIO", fill=(251, 191, 36))
    draw.text((55, h // 2 - 20), subject.upper()[:60], fill=(255, 255, 255))
    draw.text((55, h - 70), (description or "")[:120], fill=(200, 180, 140))
    file_path = os.path.join(STATIC_IMG_DIR, filename)
    img.save(file_path, format="JPEG", quality=90)
    return file_path


def generate_cyber_hud_render(subject: str, description: str, filename: str) -> str:
    return generate_thematic_visual_poster(subject, description, filename)


# ══════════════════════════════════════════════════════════════════════════════
# 4. MAIN ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════════
def generate_image_dossier(
    prompt: str,
    user_q: str = "",
    apex_reply: str = "",
    base_subject_hint: str = "",
) -> dict:
    """
    Main entry point called by `/api/generate-image`.
    Resolves short follow-up requests ("do it better", "black suit", "add iron man")
    using persistent memory and delivers the highest-ranked image across multiple 4K sources.
    """
    raw_req = (user_q or prompt or "").strip()
    subject, modifiers, call_idx, is_followup = resolve_contextual_subject(
        raw_req, prompt, base_subject_hint=base_subject_hint
    )
    aspect = detect_aspect(raw_req, subject)
    sub_key = subject.lower().strip()

    # 0. Featured Masterpiece on initial unmodified Spider-Man request (call_idx == 0)
    featured_spidey = os.path.join(STATIC_IMG_DIR, "spiderman_featured_hd.jpg")
    if (
        "spider" in sub_key
        and not modifiers
        and call_idx == 0
        and os.path.exists(featured_spidey)
    ):
        return {
            "status": "success",
            "image_url": f"/static/generated_images/spiderman_featured_hd.jpg?v={int(time.time())}",
            "caption": "Spider-Man",
            "base_subject": "Spider-Man",
            "modifiers": [],
            "is_followup": False,
            "prompt": "Spider-Man 4K Ultra-HD Masterpiece",
            "source": "4K Masterpiece Collection",
            "engine": "featured_4k",
            "aspect": "3:4",
        }

    # 1. Craft optimal search query + AI prompt via Claude / Gemini / Smart Rules
    default_search_q = _build_smart_search_query(subject, is_followup=is_followup)
    default_ai_prompt = f"Cinematic 8K ultra-detailed photorealistic shot of {subject}, dramatic lighting, sharp focus"
    directed = _claude_or_gemini_direct_query(subject, raw_req)
    if directed:
        search_q, ai_prompt = directed
    else:
        search_q, ai_prompt = default_search_q, default_ai_prompt

    logger.info(
        "Multi-Source Visual Studio: subject=%r | modifiers=%r | search_q=%r | call_idx=%d | followup=%s",
        subject, modifiers, search_q, call_idx, is_followup,
    )

    fname = f"texo_img_{uuid.uuid4().hex[:12]}.jpg"
    out_path = os.path.join(STATIC_IMG_DIR, fname)
    mem = _load_image_memory()
    base_subj = mem.get("base_subject") or subject

    # 2. Tier 1: OpenAI / Gemini Native Image (if active paid key is present)
    for gen_fn in (generate_with_openai, generate_with_gemini):
        res = gen_fn(ai_prompt, aspect)
        if res:
            raw_bytes, source_label = res
            try:
                w, h = optimize_and_save_image(raw_bytes, out_path)
                return {
                    "status": "success",
                    "image_url": f"/static/generated_images/{fname}",
                    "caption": subject,
                    "base_subject": base_subj,
                    "modifiers": modifiers,
                    "is_followup": is_followup,
                    "prompt": ai_prompt,
                    "source": source_label,
                    "aspect": aspect,
                    "width": w,
                    "height": h,
                }
            except Exception as e:
                logger.warning("Save error from %s: %s", source_label, e)

    # 3. Tier 2: Multi-Source Parallel 4K Harvester (Wallhaven 4K + Bing Ultra-HD + Lexica AI + Yahoo HD)
    multi_res = fetch_best_multisource_hd_image(
        subject=subject,
        search_query=search_q,
        ai_prompt=ai_prompt,
        call_idx=call_idx,
        has_modifiers=bool(modifiers),
    )
    if multi_res:
        raw_bytes, source_label = multi_res
        try:
            w, h = optimize_and_save_image(raw_bytes, out_path)
            return {
                "status": "success",
                "image_url": f"/static/generated_images/{fname}",
                "caption": subject,
                "base_subject": base_subj,
                "modifiers": modifiers,
                "is_followup": is_followup,
                "prompt": ai_prompt,
                "source": source_label,
                "aspect": aspect,
                "width": w,
                "height": h,
            }
        except Exception as e:
            logger.warning("Error saving multi-source 4K image: %s", e)

    # 4. Tier 3: Pollinations FLUX AI Synthesis
    poll_res = generate_with_pollinations(ai_prompt, aspect)
    if poll_res:
        raw_bytes, source_label = poll_res
        try:
            w, h = optimize_and_save_image(raw_bytes, out_path)
            return {
                "status": "success",
                "image_url": f"/static/generated_images/{fname}",
                "caption": subject,
                "base_subject": base_subj,
                "modifiers": modifiers,
                "is_followup": is_followup,
                "prompt": ai_prompt,
                "source": source_label,
                "aspect": aspect,
                "width": w,
                "height": h,
            }
        except Exception as e:
            logger.warning("Error saving Pollinations image: %s", e)

    # 5. Tier 4: Offline Canvas Fallback
    generate_thematic_visual_poster(subject, ai_prompt, fname)
    return {
        "status": "fallback",
        "image_url": f"/static/generated_images/{fname}",
        "caption": subject,
        "base_subject": base_subj,
        "modifiers": modifiers,
        "is_followup": is_followup,
        "prompt": ai_prompt,
        "source": "Studio Preview",
        "aspect": aspect,
        "width": 1024,
        "height": 768,
    }
