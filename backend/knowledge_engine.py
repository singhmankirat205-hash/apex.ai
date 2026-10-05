"""
APEX Persistent Knowledge Vault & Self-Learning Engine
======================================================
Enables APEX to permanently learn, retain, and recall knowledge from uploaded
documents (PDFs, Excel spreadsheets, CSVs, Word docs, manuals, defect logs).

Once a file is uploaded:
1. It is automatically parsed and broken into semantic knowledge chunks.
2. It is permanently indexed in the persistent Knowledge Vault on disk.
3. Every future user question automatically queries this vault across all sessions.
4. When relevant, APEX seamlessly cites and applies the learned proprietary knowledge!
"""
from __future__ import annotations
import hashlib
import json
import logging
import math
import os
import re
import threading
from datetime import datetime
from typing import Any

logger = logging.getLogger("apex.knowledge")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT_DIR = os.path.join(BASE_DIR, "data", "knowledge_vault")
INDEX_FILE = os.path.join(VAULT_DIR, "knowledge_index.json")

os.makedirs(VAULT_DIR, exist_ok=True)
_lock = threading.Lock()


def _tokenize(text: str) -> list[str]:
    """Tokenize and normalize text for inverted indexing."""
    text = text.lower()
    tokens = re.findall(r'[a-z0-9_]{2,}', text)
    stopwords = {
        "the", "and", "is", "in", "to", "of", "it", "with", "as", "for", "on",
        "this", "that", "at", "by", "from", "an", "be", "are", "was", "were",
        "or", "what", "how", "why", "when", "where", "which", "can", "could"
    }
    return [t for t in tokens if t not in stopwords]


def _load_vault() -> dict[str, Any]:
    """Load the vault from disk, or return empty structure."""
    if not os.path.isfile(INDEX_FILE):
        return {"documents": {}, "chunks": []}
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to load knowledge vault: %s", e)
        return {"documents": {}, "chunks": []}


def _save_vault(vault: dict[str, Any]) -> None:
    """Save the vault to disk atomically."""
    temp_file = INDEX_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(vault, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, INDEX_FILE)


def learn_document(filename: str, content_type: str, parsed_text: str) -> dict[str, Any]:
    """
    Permanently learn an uploaded file into the APEX Knowledge Vault.
    Chunks the content, calculates lexical signatures, and updates disk index.
    """
    if not parsed_text or len(parsed_text.strip()) < 20:
        return {"status": "skipped", "reason": "insufficient content"}

    clean_text = parsed_text.strip()
    doc_id = hashlib.md5(f"{filename}_{len(clean_text)}".encode("utf-8")).hexdigest()[:12]

    # Split into logical sections or paragraphs (~300-600 words per chunk)
    raw_paragraphs = re.split(r'\n{2,}|\n(?=[A-Z0-9\s—–-]{3,30}:)|\n(?====)', clean_text)
    chunks = []
    current_chunk = []
    current_len = 0

    for p in raw_paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        words = p_clean.split()
        if current_len + len(words) > 350 and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p_clean]
            current_len = len(words)
        else:
            current_chunk.append(p_clean)
            current_len += len(words)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    with _lock:
        vault = _load_vault()

        # Remove previous version if re-uploaded
        existing_doc = vault["documents"].get(doc_id)
        if existing_doc:
            vault["chunks"] = [c for c in vault["chunks"] if c.get("doc_id") != doc_id]

        new_chunk_records = []
        for idx, chunk_text in enumerate(chunks):
            tokens = _tokenize(chunk_text)
            new_chunk_records.append({
                "chunk_id": f"{doc_id}_{idx}",
                "doc_id": doc_id,
                "filename": filename,
                "content_type": content_type,
                "text": chunk_text,
                "tokens": tokens,
                "created_at": datetime.utcnow().isoformat()
            })

        vault["chunks"].extend(new_chunk_records)
        vault["documents"][doc_id] = {
            "doc_id": doc_id,
            "filename": filename,
            "content_type": content_type,
            "learned_at": datetime.utcnow().strftime("%d %b %Y, %H:%M UTC"),
            "total_chunks": len(new_chunk_records),
            "character_count": len(clean_text),
            "sample_snippet": clean_text[:200].replace("\n", " ") + "..."
        }

        _save_vault(vault)
        logger.info("Successfully learned document '%s' (doc_id=%s, %d chunks)",
                    filename, doc_id, len(new_chunk_records))

    return {
        "status": "learned",
        "doc_id": doc_id,
        "filename": filename,
        "chunks_indexed": len(new_chunk_records),
        "total_documents": len(vault["documents"])
    }


def search_learned_knowledge(query: str, top_k: int = 3) -> str:
    """
    Search across all previously learned documents for relevant facts,
    tables, specifications, or historical records matching the query.
    Uses strict lexical alignment to prevent false positive triggers on unrelated queries.
    """
    query_tokens = _tokenize(query)
    # Require at least 2 meaningful query tokens to search
    if len(query_tokens) < 2:
        return ""

    with _lock:
        vault = _load_vault()

    chunks = vault.get("chunks", [])
    if not chunks:
        return ""

    scores = []
    for c in chunks:
        tokens = c.get("tokens", [])
        if not tokens:
            continue
        token_set = set(tokens)
        score = 0.0
        matches = 0

        for qt in query_tokens:
            if qt in token_set:
                matches += 1
                tf = tokens.count(qt)
                fn_boost = 3.0 if qt in c.get("filename", "").lower() else 1.0
                score += (math.log(1 + tf) + 1.2) * fn_boost

        # Require at least 2 distinct keyword matches and score >= 3.5
        if matches >= 2 and score >= 3.5:
            scores.append((score, c))

    scores.sort(key=lambda x: x[0], reverse=True)
    top_matches = scores[:top_k]

    if not top_matches:
        return ""

    dossier = [
        "--- [PROPRIETARY ENTERPRISE KNOWLEDGE BASE — LEARNED FROM PREVIOUSLY UPLOADED USER FILES] ---",
        "The user previously uploaded the following documents into your permanent Knowledge Vault. "
        "Use this proprietary internal company information, cite the document name, and apply its exact numbers, tables, and rules:"
    ]

    seen_docs = set()
    for score, chunk in top_matches:
        fn = chunk["filename"]
        seen_docs.add(fn)
        dossier.append(f"\n[FROM LEARNED DOCUMENT: '{fn}']:\n{chunk['text']}")

    logger.info("Recalled %d relevant learned chunks from %s for query: %s",
                len(top_matches), list(seen_docs), query[:50])

    return "\n".join(dossier)


def get_knowledge_stats() -> dict[str, Any]:
    """Retrieve overview statistics of APEX's learned memory."""
    with _lock:
        vault = _load_vault()
    docs = list(vault.get("documents", {}).values())
    total_chunks = len(vault.get("chunks", []))
    return {
        "total_documents": len(docs),
        "total_chunks": total_chunks,
        "documents": docs
    }


def clear_knowledge(doc_id: str | None = None) -> bool:
    """Clear specific document or entire knowledge vault."""
    with _lock:
        vault = _load_vault()
        if doc_id:
            if doc_id in vault["documents"]:
                del vault["documents"][doc_id]
                vault["chunks"] = [c for c in vault["chunks"] if c.get("doc_id") != doc_id]
                _save_vault(vault)
                return True
            return False
        else:
            vault = {"documents": {}, "chunks": []}
            _save_vault(vault)
            return True
