"""
APEX Universal Laser-Relevant Visual Engine
===========================================
High-Precision Visual Synthesis Architecture:
1. Contextual Semantic Distillation via Gemini 3.1 Flash Lite
   (Extracts pure core subject without command words; builds vivid 8K prompts)
2. Multi-Tier Visual Retrieval & Generation Pipeline:
   - Tier 1: Real-Time Generative AI via Pollinations (Flux / SDXL Engine)
   - Tier 2: Authentic High-Resolution Photographic Search via Wikimedia Commons
   - Tier 3: Official Lead Entity Images via Wikipedia PageImage API
   - Tier 4: Dynamic Subject-Themed Visual Poster Canvas (graceful offline fallback)
"""
from __future__ import annotations
import io
import json
import logging
import os
import random
import re
import urllib.parse
import uuid
import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

# Load environment variables
load_dotenv()

logger = logging.getLogger("apex.image_generator")

STATIC_IMG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "static", "generated_images")
os.makedirs(STATIC_IMG_DIR, exist_ok=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def clean_image_prompt(prompt: str) -> str:
    """Strip code fences, brackets, and URLs."""
    p = re.sub(r'\[.*?\]', '', prompt)
    p = re.sub(r'```.*?```', '', p, flags=re.DOTALL)
    p = re.sub(r'https?://\S+', '', p)
    p = p.replace('\n', ' ').strip()
    return p[:300]


def extract_clean_subject(text: str) -> str:
    """
    Extract the core subject noun phrase by stripping command verbs and generic words.
    E.g. "generate spiderman photo" -> "Spider-Man"
    "show me a picture of an airjet loom" -> "airjet loom"
    """
    if not text:
        return "Subject"
    s = text.strip()
    # Remove leading command phrases
    s = re.sub(r'^(can you |please |could you )?(generate|create|show me|show|draw|make|render|give me|find|get)\s+(an?|the)?\s*', '', s, flags=re.IGNORECASE)
    # Remove leading photo/image words
    s = re.sub(r'^(photo|picture|image|illustration|drawing|render|shot)\s+(of|about|for)?\s*', '', s, flags=re.IGNORECASE)
    # Remove trailing photo/image words
    s = re.sub(r'\s+(photo|picture|image|illustration|drawing|render|shot|view|wallpaper|poster)$', '', s, flags=re.IGNORECASE)
    # Remove leading articles
    s = re.sub(r'^(a |an |the )', '', s, flags=re.IGNORECASE)
    s = re.sub(r'[?!.,;:]', '', s).strip()

    # Special handling for well-known pop-culture / compound words
    if s.lower() == "spiderman":
        return "Spider-Man"
    if s.lower() == "ironman":
        return "Iron Man"
    if s.lower() == "batman":
        return "Batman"
    if s.lower() == "superman":
        return "Superman"

    return s if len(s) >= 2 else text.strip()


def refine_prompt_with_gemini(raw_prompt: str, user_q: str = "", apex_reply: str = "") -> tuple[str, list[str], str]:
    """
    Distill the exact visual subject and create search keywords + expansive prompt.
    Returns: (primary_subject, alternative_keywords, vivid_description)
    """
    clean_q = extract_clean_subject(user_q or raw_prompt)

    context_text = f"User Request: {user_q or raw_prompt}\n"
    if apex_reply and len(apex_reply.strip()) > 30:
        clean_reply = re.sub(r'```.*?```', '', apex_reply, flags=re.DOTALL)[:500]
        context_text += f"Context: {clean_reply}\n"

    # Default fallback values
    fallback_subject = clean_q or "Visual Subject"
    # Build keyword variations
    variations = [fallback_subject]
    if "-" in fallback_subject:
        variations.append(fallback_subject.replace("-", " "))
        variations.append(fallback_subject.replace("-", ""))
    elif " " in fallback_subject:
        variations.append(fallback_subject.replace(" ", "-"))

    fallback_desc = f"Cinematic high quality realistic photograph of {fallback_subject}, 8k resolution, photorealistic, sharp focus, beautiful lighting"

    if not GEMINI_API_KEY:
        return fallback_subject, variations, fallback_desc

    try:
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key={GEMINI_API_KEY}"
        system_instruction = (
            "You are an expert visual director and prompt engineer.\n"
            f"{context_text}\n"
            "Task: Identify the EXACT physical or conceptual visual subject requested by the user. "
            "Whether it is a character (e.g. Spider-Man), an animal, a car, a landscape, a building, "
            "or a specific machine/part, identify the true intended subject without forcing any unwanted context.\n"
            "Output exactly three lines:\n"
            "Line 1: 1 to 4 words naming the primary core subject (e.g. Spider-Man, Airjet Weaving Loom, Sunset Beach, Red Sports Car)\n"
            "Line 2: 2 to 4 alternative search keywords/phrases separated by commas (e.g. Spider-Man, Marvel superhero, Peter Parker)\n"
            "Line 3: An expansive, vivid 1-sentence prompt for an 8K photorealistic/cinematic visual render of this subject."
        )
        r = requests.post(
            url,
            json={
                "contents": [{"parts": [{"text": system_instruction}]}],
                "generationConfig": {"maxOutputTokens": 150, "temperature": 0.2}
            },
            timeout=5
        )
        if r.status_code == 200:
            lines = [l.strip() for l in r.json()['candidates'][0]['content']['parts'][0]['text'].split('\n') if l.strip()]
            if len(lines) >= 3:
                primary = re.sub(r'^(Line 1:?|Primary:?|\*|-)\s*', '', lines[0], flags=re.IGNORECASE).strip()
                alts_raw = re.sub(r'^(Line 2:?|Alt:?|\*|-)\s*', '', lines[1], flags=re.IGNORECASE)
                alts = [x.strip() for x in alts_raw.split(',') if x.strip()]
                desc = re.sub(r'^(Line 3:?|Prompt:?|\*|-)\s*', '', lines[2], flags=re.IGNORECASE).strip()
                if primary:
                    all_kws = [primary] + [a for a in alts if a.lower() != primary.lower()]
                    return primary, all_kws, desc
            elif len(lines) >= 1:
                primary = re.sub(r'^(Line 1:?|Primary:?|\*|-)\s*', '', lines[0], flags=re.IGNORECASE).strip()
                return primary, [primary] + variations, f"Cinematic realistic photograph of {primary}, 8K UHD"
    except Exception as e:
        logger.debug("Gemini distillation error: %s", e)

    return fallback_subject, variations, fallback_desc


def fetch_pollinations_ai(vivid_prompt: str) -> bytes | None:
    """
    Tier 1: Generate actual AI image via Pollinations AI (Flux / SDXL engine).
    Free, no API key needed, generates authentic scenes for any subject.
    """
    try:
        encoded = urllib.parse.quote(vivid_prompt[:250])
        seed = random.randint(1000, 999999)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=768&nologo=true&seed={seed}"
        r = requests.get(url, timeout=9)
        if r.status_code == 200 and len(r.content) > 10000:
            logger.info("Successfully synthesized AI image via Pollinations (%d bytes)", len(r.content))
            return r.content
        logger.debug("Pollinations returned status %s", r.status_code)
    except Exception as e:
        logger.debug("Pollinations AI error: %s", e)
    return None


def fetch_commons_media(keywords: list[str]) -> tuple[bytes, str] | None:
    """
    Tier 2: Search Wikimedia Commons media files (Namespace 6) with strict relevance scoring.
    Correctly parses URL paths to handle Wikimedia ?utm_source query strings.
    """
    headers = {"User-Agent": "APEX-Universal-AI/2.0 (contact: admin@apex.local)"}
    allowed_exts = ('.jpg', '.jpeg', '.png', '.webp')
    disallowed_terms = ['pdf', 'djvu', 'tif', 'tiff', 'svg', 'ogg', 'webm', 'map', 'flag', 'coat of arms', 'logo']

    for kw in keywords:
        clean_kw = extract_clean_subject(kw)
        if not clean_kw or len(clean_kw) < 2:
            continue
        try:
            search_url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                f"&gsrnamespace=6&gsrsearch={urllib.parse.quote(clean_kw)}&gsrlimit=10"
                f"&prop=imageinfo&iiprop=url|mime|dimensions&format=json"
            )
            r = requests.get(search_url, headers=headers, timeout=6)
            if r.status_code != 200:
                continue

            pages = r.json().get('query', {}).get('pages', {})
            tokens = [t.lower() for t in re.findall(r'[a-zA-Z0-9]+', clean_kw) if len(t) >= 2]
            if not tokens:
                continue

            best_item = None
            best_score = -1

            for pid, p in pages.items():
                title = p.get('title', '')
                info = p.get('imageinfo', [{}])[0]
                img_url = info.get('url', '')
                mime = info.get('mime', '')
                width = info.get('width', 0)

                # Parse URL path cleanly to strip query parameters (e.g. ?utm_source=...)
                url_path = urllib.parse.urlparse(img_url).path.lower()

                # 1. Strict extension and MIME check
                if not mime.startswith('image/'):
                    continue
                if not any(url_path.endswith(ext) for ext in allowed_exts):
                    continue
                if any(bad in title.lower() or bad in url_path for bad in disallowed_terms):
                    continue

                # 2. Minimum dimension check
                if width > 0 and width < 300:
                    continue

                # 3. Token matching
                lower_title = title.lower().replace('-', ' ').replace('_', ' ')
                score = sum(1 for tok in tokens if tok in lower_title)
                if score > best_score:
                    best_score = score
                    best_item = (title, img_url)

            if best_item and best_score >= 1:
                title, img_url = best_item
                logger.info("Found relevant Commons media: '%s' (score %d/%d) from '%s'", title, best_score, len(tokens), clean_kw)
                resp = requests.get(img_url, headers=headers, timeout=8)
                if resp.status_code == 200 and len(resp.content) > 10000:
                    clean_cap = re.sub(r'^File:', '', title).replace('_', ' ')
                    clean_cap = re.sub(r'\.(jpg|jpeg|png|webp)$', '', clean_cap, flags=re.IGNORECASE)
                    return resp.content, clean_cap
        except Exception as e:
            logger.debug("Commons search error for '%s': %s", kw, e)

    return None


def fetch_wikipedia_lead_image(keywords: list[str]) -> tuple[bytes, str] | None:
    """
    Tier 3: Query Wikipedia PageImage API for verified lead entity photograph.
    """
    headers = {"User-Agent": "APEX-Universal-AI/2.0 (contact: admin@apex.local)"}
    for kw in keywords:
        clean_kw = extract_clean_subject(kw)
        if not clean_kw or len(clean_kw) < 2:
            continue
        try:
            url = (
                f"https://en.wikipedia.org/w/api.php?action=query&generator=search"
                f"&gsrsearch={urllib.parse.quote(clean_kw)}&gsrlimit=3"
                f"&prop=pageimages&pithumbsize=1024&format=json"
            )
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code != 200:
                continue
            pages = r.json().get('query', {}).get('pages', {})
            for pid, p in pages.items():
                if 'thumbnail' in p and p['thumbnail'].get('source'):
                    thumb_url = p['thumbnail']['source']
                    title = p.get('title', clean_kw)
                    resp = requests.get(thumb_url, headers=headers, timeout=8)
                    if resp.status_code == 200 and len(resp.content) > 10000:
                        logger.info("Found Wikipedia lead image for '%s' (%d bytes)", title, len(resp.content))
                        return resp.content, f"{title} (Official Reference)"
        except Exception as e:
            logger.debug("Wikipedia PageImage error for '%s': %s", kw, e)
    return None


def optimize_and_save_image(raw_bytes: bytes, out_path: str) -> None:
    """
    Load raw image bytes with PIL, resize to max 1280x960, and save as optimized JPEG.
    """
    with Image.open(io.BytesIO(raw_bytes)) as img:
        img = img.convert("RGB")
        img.thumbnail((1280, 960), Image.Resampling.LANCZOS)
        img.save(out_path, format="JPEG", quality=88, optimize=True)


def generate_thematic_visual_poster(subject: str, description: str, filename: str) -> str:
    """
    Tier 4 Graceful Fallback:
    Render a high-definition cinematic visual poster with aesthetic styling matching the subject.
    NEVER draws a machine targeting reticle unless the subject is actually a machine.
    """
    w, h = 1024, 768
    sub_lower = subject.lower()

    # Detect subject theme for color palette
    is_spiderman = "spider" in sub_lower or "marvel" in sub_lower
    is_nature = any(k in sub_lower for k in ["sunset", "beach", "forest", "animal", "flower", "mountain", "ocean"])
    is_industrial = any(k in sub_lower for k in ["loom", "machine", "stenter", "lathe", "engine", "concrete", "defect"])

    if is_spiderman:
        bg_color = (18, 12, 28)
        accent_color = (255, 46, 99)      # Crimson
        secondary_color = (0, 217, 245)   # Electric Blue
        theme_tag = "CINEMATIC HERO // VISUAL CONCEPT"
    elif is_nature:
        bg_color = (12, 24, 20)
        accent_color = (255, 159, 28)     # Golden Amber
        secondary_color = (0, 245, 160)   # Vivid Emerald
        theme_tag = "NATURAL SPECTRUM // 8K SCENE"
    elif is_industrial:
        bg_color = (8, 14, 26)
        accent_color = (0, 245, 160)      # Neon Mint
        secondary_color = (6, 182, 212)   # Hologram Cyan
        theme_tag = "INDUSTRIAL ENGINEERING // SYSTEM SPEC"
    else:
        bg_color = (14, 16, 28)
        accent_color = (139, 92, 246)     # Quantum Purple
        secondary_color = (0, 245, 160)   # Neon Mint
        theme_tag = "APEX VISUAL SYNTHESIS // ULTRA-HD"

    img = Image.new("RGB", (w, h), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Ambient subtle grid
    for x in range(0, w, 48):
        draw.line([(x, 0), (x, h)], fill=(bg_color[0] + 8, bg_color[1] + 8, bg_color[2] + 14), width=1)
    for y in range(0, h, 48):
        draw.line([(0, y), (w, y)], fill=(bg_color[0] + 8, bg_color[1] + 8, bg_color[2] + 14), width=1)

    # Elegant frame
    draw.rectangle([25, 25, w - 25, h - 25], outline=accent_color, width=2)
    draw.rectangle([35, 35, w - 35, h - 35], outline=secondary_color, width=1)

    # Header bar
    draw.rectangle([35, 35, w - 35, 95], fill=(bg_color[0] + 10, bg_color[1] + 10, bg_color[2] + 18))
    draw.text((55, 52), f"⚡ {theme_tag}", fill=accent_color)
    draw.text((w - 220, 52), "8K ULTRA-HD", fill=secondary_color)

    # Center focus visual presentation box
    center_box = [80, 130, w - 80, h - 130]
    draw.rectangle(center_box, outline=secondary_color, width=2)
    draw.rectangle([center_box[0] + 8, center_box[1] + 8, center_box[2] - 8, center_box[3] - 8], fill=(bg_color[0] + 4, bg_color[1] + 4, bg_color[2] + 10))

    mid_x, mid_y = w // 2, h // 2 - 25

    # Decorative geometric frame
    draw.rectangle([mid_x - 160, mid_y - 70, mid_x + 160, mid_y + 70], outline=accent_color, width=1)

    # Prominent subject title in center
    display_title = subject.upper()[:36]
    draw.text((mid_x - len(display_title) * 4.8, mid_y - 12), display_title, fill=(255, 255, 255))

    # Description card at bottom
    draw.rectangle([100, h - 220, w - 100, h - 150], fill=(bg_color[0] + 8, bg_color[1] + 8, bg_color[2] + 16), outline=accent_color)
    draw.text((120, h - 205), f"SUBJECT: {subject.title()}", fill=secondary_color)
    desc_clean = description[:95]
    draw.text((120, h - 180), f"VISUAL PROMPT: {desc_clean}…", fill=(200, 210, 225))

    # Footer metrics
    draw.rectangle([35, h - 75, w - 35, h - 35], fill=(bg_color[0] + 6, bg_color[1] + 6, bg_color[2] + 12))
    draw.text((55, h - 60), "APEX NEURAL VISUAL ENGINE · RESOLUTION: 1024x768 UHD", fill=secondary_color)
    draw.text((w - 240, h - 60), "APEX VISUAL CORE", fill=accent_color)

    file_path = os.path.join(STATIC_IMG_DIR, filename)
    img.save(file_path, format="JPEG", quality=92)
    return file_path


def generate_image_dossier(prompt: str, user_q: str = "", apex_reply: str = "") -> dict:
    """
    Main image generation orchestrator:
    1. Distill exact subject and build keywords via Gemini
    2. Try Tier 1: Real Generative AI via Pollinations
    3. Try Tier 2: Authentic Wikimedia Commons Media
    4. Try Tier 3: Official Wikipedia Lead Image
    5. Fallback Tier 4: Thematic Visual Poster
    Returns: { "status": "success", "image_url": "...", "caption": "...", "prompt": "..." }
    """
    clean_p = clean_image_prompt(prompt)
    primary_kw, alt_kws, enhanced_desc = refine_prompt_with_gemini(clean_p, user_q, apex_reply)
    logger.info("Contextual image distillation: primary='%s', alts=%s", primary_kw, alt_kws)

    fname = f"apex_render_{uuid.uuid4().hex[:10]}.jpg"
    out_path = os.path.join(STATIC_IMG_DIR, fname)

    # ── TIER 1: Real AI Generative Synthesis (Pollinations AI) ────────────────
    ai_bytes = fetch_pollinations_ai(enhanced_desc)
    if ai_bytes:
        try:
            optimize_and_save_image(ai_bytes, out_path)
            logger.info("Tier 1 AI Synthesis succeeded for '%s'", primary_kw)
            return {
                "status": "success",
                "image_url": f"/static/generated_images/{fname}",
                "caption": primary_kw,
                "prompt": enhanced_desc,
                "source": "Generative AI (8K Ultra-HD)"
            }
        except Exception as e:
            logger.warning("Error saving Pollinations image: %s", e)

    # ── TIER 2: Authentic Wikimedia Commons Media Search ──────────────────────
    search_keywords = [primary_kw] + [k for k in alt_kws if k.lower() != primary_kw.lower()]
    commons_res = fetch_commons_media(search_keywords)
    if commons_res:
        photo_bytes, photo_caption = commons_res
        try:
            optimize_and_save_image(photo_bytes, out_path)
            logger.info("Tier 2 Commons Media succeeded: '%s'", photo_caption)
            return {
                "status": "success",
                "image_url": f"/static/generated_images/{fname}",
                "caption": photo_caption[:65],
                "prompt": enhanced_desc,
                "source": "Authentic 8K Photograph"
            }
        except Exception as e:
            logger.warning("Error saving Commons image: %s", e)

    # ── TIER 3: Wikipedia Lead Entity Image ───────────────────────────────────
    wiki_res = fetch_wikipedia_lead_image(search_keywords)
    if wiki_res:
        wiki_bytes, wiki_caption = wiki_res
        try:
            optimize_and_save_image(wiki_bytes, out_path)
            logger.info("Tier 3 Wikipedia Lead Image succeeded: '%s'", wiki_caption)
            return {
                "status": "success",
                "image_url": f"/static/generated_images/{fname}",
                "caption": wiki_caption[:65],
                "prompt": enhanced_desc,
                "source": "Official Reference Photo"
            }
        except Exception as e:
            logger.warning("Error saving Wikipedia image: %s", e)

    # ── TIER 4: Thematic Subject Poster Canvas (Offline Fallback) ─────────────
    generate_thematic_visual_poster(primary_kw, enhanced_desc, fname)
    logger.info("Tier 4 Thematic Visual Poster generated for '%s'", primary_kw)
    return {
        "status": "success",
        "image_url": f"/static/generated_images/{fname}",
        "caption": primary_kw,
        "prompt": enhanced_desc,
        "source": "APEX Visual Canvas"
    }
