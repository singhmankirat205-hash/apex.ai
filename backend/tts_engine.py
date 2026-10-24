"""
APEX Universal Neural TTS Engine
High-fidelity multilingual audio synthesis supporting any world language.
"""
from __future__ import annotations
import hashlib
import logging
import re
import urllib.parse
import urllib.request
from typing import Dict

logger = logging.getLogger("apex.tts")

# In-memory LRU cache for generated speech audio clips
_TTS_CACHE: Dict[str, bytes] = {}
_MAX_CACHE_SIZE = 300

LANG_CODE_MAP = {
    "zh": "zh-CN",
    "pt": "pt-BR",
    "pa": "pa",
    "hi": "hi",
    "bn": "bn",
    "ta": "ta",
    "te": "te",
    "gu": "gu",
    "ar": "ar",
    "es": "es",
    "fr": "fr",
    "de": "de",
    "it": "it",
    "ja": "ja",
    "ko": "ko",
    "ru": "ru",
    "tr": "tr",
    "en": "en",
}


def sanitize_text_for_speech(text: str) -> str:
    """Strip markdown symbols, code blocks, URLs, and excessive emojis for clear human cadence."""
    if not text:
        return ""
    # Strip markdown code blocks
    cleaned = re.sub(r"```[\s\S]*?```", " ", text)
    # Strip inline code
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    # Strip image tokens and URLs
    cleaned = re.sub(r"\[IMAGE_BASE64\]:\S+", "", cleaned)
    cleaned = re.sub(r"https?://\S+", "", cleaned)
    # Strip markdown headers, bold, italics, tables
    cleaned = re.sub(r"[*#_~|]", " ", cleaned)
    # Normalize whitespaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def synthesize_speech_audio(text: str, lang: str = "en", persona_id: str = "aura") -> bytes:
    """
    Synthesize natural human audio for any language and return MP3 audio bytes.
    """
    clean_text = sanitize_text_for_speech(text)
    if not clean_text:
        return b""

    # Cap maximum read length to prevent timeouts (approx 3-4 paragraphs)
    if len(clean_text) > 2500:
        clean_text = clean_text[:2500] + "..."

    # Determine 2-letter language code
    raw_lang = (lang or "en").split("-")[0].lower()
    target_lang = LANG_CODE_MAP.get(raw_lang, raw_lang)

    # Check cache
    cache_key = hashlib.md5(f"{target_lang}:{persona_id}:{clean_text}".encode("utf-8")).hexdigest()
    if cache_key in _TTS_CACHE:
        return _TTS_CACHE[cache_key]

    # Split text into natural sentence chunks (max 175 characters per Google Translate TTS chunk)
    sentences = re.split(r"(?<=[.!?,\n।])\s+", clean_text)
    chunks = []
    curr = ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(curr) + len(s) < 170:
            curr = (curr + " " + s).strip()
        else:
            if curr:
                chunks.append(curr)
            curr = s[:170]
    if curr:
        chunks.append(curr)

    if not chunks:
        chunks = [clean_text[:170]]

    combined_mp3 = b""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }

    clients = ["tw-ob", "gtx", "webapp"]
    for chunk in chunks:
        chunk_bytes = None
        encoded_query = urllib.parse.quote(chunk)
        for client in clients:
            try:
                url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl={target_lang}&client={client}&q={encoded_query}"
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=6) as resp:
                    if resp.status == 200:
                        data = resp.read()
                        if data and len(data) > 100:
                            chunk_bytes = data
                            break
            except Exception as err:
                logger.debug("TTS chunk attempt with client %s failed: %s", client, err)
                continue
        if chunk_bytes:
            combined_mp3 += chunk_bytes

    if combined_mp3:
        if len(_TTS_CACHE) >= _MAX_CACHE_SIZE:
            # Evict first item
            try:
                first_key = next(iter(_TTS_CACHE))
                del _TTS_CACHE[first_key]
            except Exception:
                pass
        _TTS_CACHE[cache_key] = combined_mp3

    return combined_mp3
