"""
APEX Persistent Knowledge Vault & Autonomous Self-Learning AI Brain Engine
==========================================================================
Enables TEXO / APEX to:
1. Permanently learn, retain, and recall knowledge from uploaded documents
   (PDFs, Excel spreadsheets, CSVs, Word docs, manuals, defect logs, images).
2. Autonomously learn from EVERY user prompt, multi-source web harvest
   (Wikipedia, DuckDuckGo, Google News, ArXiv, StackExchange, HackerNews),
   and its own synthesized answer after every chat turn.
3. Track Topic Evolution Generations (Generation 1 -> Generation 2 -> Generation N)
   so that every time a user asks about a topic or follows up, the chatbot
   recalls what it learned previously and delivers a deeper, more accurate,
   and noticeably improved answer next time.
"""
from __future__ import annotations
import hashlib
import json
import logging
import math
import os
import re
import threading
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("apex.knowledge")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VAULT_DIR = os.path.join(BASE_DIR, "data", "knowledge_vault")
INDEX_FILE = os.path.join(VAULT_DIR, "knowledge_index.json")

os.makedirs(VAULT_DIR, exist_ok=True)
_lock = threading.Lock()

_STOPWORDS = {
    "the", "and", "is", "in", "to", "of", "it", "with", "as", "for", "on",
    "this", "that", "at", "by", "from", "an", "be", "are", "was", "were",
    "or", "what", "how", "why", "when", "where", "which", "can", "could",
    "would", "should", "tell", "me", "about", "explain", "give", "show",
    "please", "make", "write", "describe", "more", "better", "detail",
    "detailed", "answer", "question", "help", "need", "want", "know"
}


def _tokenize(text: str) -> list[str]:
    """Tokenize and normalize text for inverted indexing."""
    text = (text or "").lower()
    tokens = re.findall(r'[a-z0-9_]{2,}', text)
    return [t for t in tokens if t not in _STOPWORDS]


def _extract_canonical_topic(query: str) -> str:
    """Extract a canonical topic signature from a user prompt."""
    q = re.sub(r'\[IMAGE_BASE64\]:\S+', '', query or '').strip()
    q = re.sub(r'\[USER INQUIRY.*?\]:', '', q, flags=re.DOTALL).strip()
    q = re.sub(
        r'^(?:can you |could you |please |kindly |tell me |explain |what is |what are |who is |who was |'
        r'how does |how do |how to |give me |show me |analyze |search for |find |write |describe |'
        r'in detail |detailed answer on |about )+',
        '',
        q,
        flags=re.IGNORECASE
    ).strip()
    tokens = _tokenize(q)
    if not tokens:
        tokens = re.findall(r'[a-z0-9]{2,}', q.lower())
    return " ".join(tokens[:6]).strip() or q[:40].lower().strip()


def _load_vault() -> dict[str, Any]:
    """Load the vault from disk, or return empty structure."""
    if not os.path.isfile(INDEX_FILE):
        return {"documents": {}, "chunks": [], "brain_stats": {"total_turns_learned": 0, "total_evolutions": 0}}
    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "documents" not in data:
                data["documents"] = {}
            if "chunks" not in data:
                data["chunks"] = []
            if "brain_stats" not in data:
                data["brain_stats"] = {"total_turns_learned": 0, "total_evolutions": 0}
            return data
    except Exception as e:
        logger.error("Failed to load knowledge vault: %s", e)
        return {"documents": {}, "chunks": [], "brain_stats": {"total_turns_learned": 0, "total_evolutions": 0}}


def _save_vault(vault: dict[str, Any]) -> None:
    """Save the vault to disk atomically."""
    temp_file = INDEX_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(vault, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, INDEX_FILE)


def _distill_high_value_facts(answer_text: str, max_facts: int = 10) -> list[str]:
    """
    Extract high-density factual statements, formulas, quantitative metrics,
    and key takeaways from the assistant's response for permanent self-learning.
    """
    if not answer_text:
        return []
    # Strip code blocks (action, chart, file_export) so only pure knowledge is retained
    cleaned = re.sub(r'```(?:chart|action|escalation|file_export|export|document)[\s\S]*?```', '', answer_text)
    lines = [ln.strip() for ln in cleaned.splitlines() if ln.strip()]

    candidates: list[tuple[float, str]] = []
    seen_norm: set[str] = set()

    for ln in lines:
        # Skip markdown table separator rows or very short headers
        if re.match(r'^[\|\-\s:]+$', ln) or len(ln) < 22:
            continue
        # Clean markdown bullets/headers
        clean_ln = re.sub(r'^(?:[#*>•\-\+]|\d+\.)\s*', '', ln).strip()
        if len(clean_ln) < 22 or len(clean_ln) > 360:
            continue
        # Skip follow-up questions at the end
        if clean_ln.endswith('?') and len(clean_ln) < 160:
            continue

        norm = re.sub(r'\W+', '', clean_ln.lower())[:60]
        if not norm or norm in seen_norm:
            continue
        seen_norm.add(norm)

        # Score information density (numbers, units, definitions, formulas, table rows)
        score = 1.0
        if re.search(r'\b\d+(?:\.\d+)?\s*(?:%|°C|K|MPa|PSI|bar|mm|cm|m|km|kg|g|mg|Hz|kW|MW|GW|V|A|Nm|RPM|GSM|USD|\$|€|£|years?|days?|seconds?|ms)\b', clean_ln, re.I):
            score += 2.5
        if any(sym in clean_ln for sym in ('=', '≈', '×', '÷', '±', '≤', '≥', ':')):
            score += 1.8
        if ln.startswith('|') and ln.endswith('|') and ln.count('|') >= 3:
            score += 1.5
        if '**' in clean_ln:
            score += 1.0

        candidates.append((score, clean_ln))

    candidates.sort(key=lambda x: x[0], reverse=True)
    return [c[1] for c in candidates[:max_facts]]


def _extract_source_lines(multi_source_dossier: str, max_lines: int = 12) -> tuple[list[str], list[str]]:
    """Extract clean verified bullet lines and source names from a multi-source web dossier."""
    if not multi_source_dossier or not multi_source_dossier.strip():
        return [], []

    sources_detected: list[str] = []
    fact_lines: list[str] = []

    header_map = {
        "wikipedia": "Wikipedia Encyclopedia",
        "google news": "Google News Live",
        "arxiv": "ArXiv Scientific Papers",
        "duckduckgo": "DuckDuckGo Knowledge Graph",
        "stackexchange": "StackExchange Technical Q&A",
        "stackoverflow": "StackOverflow Engineering",
        "hackernews": "HackerNews Tech Intelligence",
        "wikidata": "Wikidata Global Graph",
    }

    for raw_ln in multi_source_dossier.splitlines():
        ln = raw_ln.strip()
        if not ln:
            continue
        low = ln.lower()
        for key, label in header_map.items():
            if key in low and label not in sources_detected:
                sources_detected.append(label)
        if ln.startswith("---") and ln.endswith("---"):
            continue
        clean_bullet = re.sub(r'^[•\-\*]\s*', '', ln).strip()
        if len(clean_bullet) >= 20 and clean_bullet not in fact_lines:
            fact_lines.append(clean_bullet[:320])

    return fact_lines[:max_lines], sources_detected


def autonomous_learn_turn(
    query: str,
    answer: str,
    multi_source_dossier: str = "",
    user_role: str = "GENERAL",
    industry: str = "general"
) -> dict[str, Any]:
    """
    Autonomous Self-Learning Engine:
    Executed after EVERY prompt/chat turn. Synthesizes external multi-source intelligence
    and the chatbot's answer into a self-evolving knowledge node in the Knowledge Vault.
    If the topic was already learned previously, upgrades its Generation (Gen N -> Gen N+1)
    and merges new facts so the next answer on this topic is even deeper and more accurate.
    """
    clean_q = re.sub(r'\[IMAGE_BASE64\]:\S+', '', query or '').strip()
    if not clean_q or len(clean_q) < 3 or not answer or len(answer.strip()) < 30:
        return {"status": "skipped", "reason": "short_turn"}

    canonical_topic = _extract_canonical_topic(clean_q)
    if not canonical_topic or len(canonical_topic) < 2:
        return {"status": "skipped", "reason": "no_topic"}

    query_tokens = _tokenize(clean_q)
    if not query_tokens:
        return {"status": "skipped", "reason": "no_tokens"}

    distilled_answer_facts = _distill_high_value_facts(answer, max_facts=10)
    external_facts, detected_sources = _extract_source_lines(multi_source_dossier, max_lines=12)

    if not distilled_answer_facts and not external_facts:
        return {"status": "skipped", "reason": "no_extractable_facts"}

    with _lock:
        vault = _load_vault()
        docs = vault.setdefault("documents", {})
        chunks = vault.setdefault("chunks", [])
        brain_stats = vault.setdefault("brain_stats", {"total_turns_learned": 0, "total_evolutions": 0})

        # Check if an existing self-learned brain document covers this topic
        matched_doc_id = None
        q_set = set(query_tokens)
        best_overlap = 0.0

        for d_id, d_meta in docs.items():
            if d_meta.get("content_type") != "autonomous_ai_brain":
                continue
            existing_tokens = set(d_meta.get("topic_tokens", []))
            if not existing_tokens:
                continue
            intersection = len(q_set & existing_tokens)
            union = max(1, len(q_set | existing_tokens))
            jaccard = intersection / union
            existing_canon = d_meta.get("canonical_topic", "")
            # Match if exact canonical topic, substring match, strong token intersection (>=2), or single-term match
            is_match = (
                existing_canon == canonical_topic
                or (len(canonical_topic) >= 5 and canonical_topic in existing_canon)
                or (len(existing_canon) >= 5 and existing_canon in canonical_topic)
                or jaccard >= 0.35
                or intersection >= 2
                or (len(q_set) == 1 and intersection >= 1)
            )
            if is_match:
                overlap_score = jaccard + (intersection * 0.25)
                if overlap_score > best_overlap:
                    best_overlap = overlap_score
                    matched_doc_id = d_id

        if matched_doc_id and matched_doc_id in docs:
            doc_id = matched_doc_id
            prev_meta = docs[doc_id]
            generation = int(prev_meta.get("generation", 1)) + 1
            prev_sources = list(prev_meta.get("sources", []))
            for s in detected_sources:
                if s not in prev_sources:
                    prev_sources.append(s)
            if "TEXO Self-Reflection Synthesis" not in prev_sources:
                prev_sources.append("TEXO Self-Reflection Synthesis")

            # Merge previous facts with new facts without duplication
            prev_ext_facts = list(prev_meta.get("external_facts", []))
            for ef in external_facts:
                if ef not in prev_ext_facts:
                    prev_ext_facts.append(ef)
            merged_ext_facts = prev_ext_facts[-16:]

            prev_ans_facts = list(prev_meta.get("distilled_facts", []))
            for af in distilled_answer_facts:
                if af not in prev_ans_facts:
                    prev_ans_facts.append(af)
            merged_ans_facts = prev_ans_facts[-16:]

            prev_queries = list(prev_meta.get("past_prompts", []))
            if clean_q[:140] not in prev_queries:
                prev_queries.append(clean_q[:140])
            prev_queries = prev_queries[-6:]

            merged_tokens = list(dict.fromkeys(prev_meta.get("topic_tokens", []) + query_tokens + _tokenize(" ".join(merged_ans_facts[:5]))))
            brain_stats["total_evolutions"] = int(brain_stats.get("total_evolutions", 0)) + 1
        else:
            doc_id = "brain_" + hashlib.md5(canonical_topic.encode("utf-8")).hexdigest()[:10]
            generation = 1
            prev_sources = list(detected_sources) + ["TEXO Self-Reflection Synthesis"]
            merged_ext_facts = external_facts[-14:]
            merged_ans_facts = distilled_answer_facts[-14:]
            prev_queries = [clean_q[:140]]
            merged_tokens = list(dict.fromkeys(query_tokens + _tokenize(" ".join(merged_ans_facts[:5]))))

        brain_stats["total_turns_learned"] = int(brain_stats.get("total_turns_learned", 0)) + 1
        brain_stats["last_learned_topic"] = canonical_topic
        brain_stats["last_learned_at"] = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")

        sources_str = ", ".join(prev_sources) if prev_sources else "Multi-Source Global Intelligence"
        synthesized_lines = [
            f"TOPIC MASTERY NODE: '{canonical_topic.upper()}' (Evolution Generation #{generation})",
            f"Knowledge Sources Assimilated: {sources_str}",
            f"Previous User Inquiries on this Topic: {' | '.join(prev_queries)}",
        ]
        if merged_ext_facts:
            synthesized_lines.append("\n[VERIFIED MULTI-SOURCE EXTERNAL KNOWLEDGE LEARNED]:")
            for ef in merged_ext_facts:
                synthesized_lines.append(f"• {ef}")
        if merged_ans_facts:
            synthesized_lines.append("\n[DISTILLED HIGH-PRECISION INSIGHTS & FORMULAS FROM PRIOR ANSWERS]:")
            for af in merged_ans_facts:
                synthesized_lines.append(f"• {af}")

        synthesized_lines.append(
            f"\n[CONTINUOUS SELF-IMPROVEMENT DIRECTIVE FOR GENERATION #{generation + 1}]:\n"
            f"You have already learned and answered {generation} turn(s) on '{canonical_topic}'. "
            f"When answering this prompt, build upon all verified facts above, deliver a MORE INFORMATIVE, "
            f"MORE PRECISE, and DEEPER response than Generation #{generation}, add concrete metrics/examples, "
            f"and strictly obey the human user's exact command boundaries."
        )

        chunk_text = "\n".join(synthesized_lines)

        # Replace chunk in vault
        vault["chunks"] = [c for c in chunks if c.get("doc_id") != doc_id]
        vault["chunks"].append({
            "chunk_id": f"{doc_id}_0",
            "doc_id": doc_id,
            "filename": f"AI_Brain_Topic: {canonical_topic.title()}",
            "content_type": "autonomous_ai_brain",
            "generation": generation,
            "sources": prev_sources,
            "text": chunk_text,
            "tokens": merged_tokens,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        docs[doc_id] = {
            "doc_id": doc_id,
            "filename": f"AI_Brain_Topic: {canonical_topic.title()}",
            "canonical_topic": canonical_topic,
            "content_type": "autonomous_ai_brain",
            "generation": generation,
            "sources": prev_sources,
            "topic_tokens": merged_tokens[:50],
            "external_facts": merged_ext_facts,
            "distilled_facts": merged_ans_facts,
            "past_prompts": prev_queries,
            "learned_at": datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"),
            "total_chunks": 1,
            "character_count": len(chunk_text),
            "sample_snippet": (merged_ans_facts[0] if merged_ans_facts else (merged_ext_facts[0] if merged_ext_facts else clean_q))[:200]
        }

        # Cap autonomous brain nodes at 250 most recent to keep index fast
        brain_docs = [
            (k, v) for k, v in docs.items()
            if v.get("content_type") == "autonomous_ai_brain"
        ]
        if len(brain_docs) > 250:
            oldest_id = brain_docs[0][0]
            del docs[oldest_id]
            vault["chunks"] = [c for c in vault["chunks"] if c.get("doc_id") != oldest_id]

        _save_vault(vault)
        logger.info(
            "AI Brain self-learned topic '%s' (doc_id=%s, Generation=%d, Sources=%d, Facts=%d)",
            canonical_topic, doc_id, generation, len(prev_sources), len(merged_ext_facts) + len(merged_ans_facts)
        )

    return {
        "status": "learned",
        "doc_id": doc_id,
        "topic": canonical_topic,
        "generation": generation,
        "sources": prev_sources,
        "facts_count": len(merged_ext_facts) + len(merged_ans_facts)
    }


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
                "created_at": datetime.now(timezone.utc).isoformat()
            })

        vault["chunks"].extend(new_chunk_records)
        vault["documents"][doc_id] = {
            "doc_id": doc_id,
            "filename": filename,
            "content_type": content_type,
            "learned_at": datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"),
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


def search_learned_knowledge(query: str, top_k: int = 4) -> str:
    """
    Search across all previously learned documents AND autonomous self-learned
    AI Brain nodes for relevant facts, tables, specifications, and prior answer
    generations matching the query.
    """
    query_tokens = _tokenize(query)
    if not query_tokens:
        return ""

    with _lock:
        vault = _load_vault()

    chunks = vault.get("chunks", [])
    if not chunks:
        return ""

    scores = []
    single_token_query = (len(query_tokens) == 1)

    for c in chunks:
        tokens = c.get("tokens", [])
        if not tokens:
            continue
        token_set = set(tokens)
        score = 0.0
        matches = 0
        fn_lower = c.get("filename", "").lower()
        is_brain_node = (c.get("content_type") == "autonomous_ai_brain")

        for qt in query_tokens:
            if qt in token_set or qt in fn_lower:
                matches += 1
                tf = tokens.count(qt)
                fn_boost = 3.5 if qt in fn_lower else 1.0
                gen_boost = 1.0 + min(0.5, 0.1 * int(c.get("generation", 1))) if is_brain_node else 1.0
                score += (math.log(1 + tf) + 1.4) * fn_boost * gen_boost

        if single_token_query:
            if matches >= 1 and (query_tokens[0] in fn_lower or score >= 3.2):
                scores.append((score, c))
        else:
            if (matches >= 2 and score >= 3.2) or (matches >= 1 and is_brain_node and any(qt in fn_lower for qt in query_tokens)):
                scores.append((score, c))

    scores.sort(key=lambda x: x[0], reverse=True)
    top_matches = scores[:top_k]

    if not top_matches:
        return ""

    dossier = [
        "--- [PERMANENT KNOWLEDGE VAULT & AUTONOMOUS SELF-LEARNED AI BRAIN] ---",
        "You have permanently learned the following knowledge from prior multi-source harvests, previous prompt-answer evolutions, and uploaded documents. "
        "Synthesize these facts to deliver an upgraded, deeper, more accurate, and more informative response than any previous turn:"
    ]

    seen_docs = set()
    for score, chunk in top_matches:
        fn = chunk["filename"]
        seen_docs.add(fn)
        if chunk.get("content_type") == "autonomous_ai_brain":
            gen = chunk.get("generation", 1)
            dossier.append(f"\n[SELF-LEARNED BRAIN NODE — '{fn}' (Generation #{gen} -> Upgrading to Generation #{gen + 1})]:\n{chunk['text']}")
        else:
            dossier.append(f"\n[FROM LEARNED DOCUMENT: '{fn}']:\n{chunk['text']}")

    logger.info("Recalled %d relevant learned chunks from %s for query: %s",
                len(top_matches), list(seen_docs), query[:50])

    return "\n".join(dossier)


def get_knowledge_stats() -> dict[str, Any]:
    """Retrieve overview statistics of APEX's learned memory and self-evolving AI brain."""
    with _lock:
        vault = _load_vault()
    docs = list(vault.get("documents", {}).values())
    total_chunks = len(vault.get("chunks", []))
    brain_nodes = [d for d in docs if d.get("content_type") == "autonomous_ai_brain"]
    brain_stats = vault.get("brain_stats", {})
    return {
        "total_documents": len(docs),
        "total_chunks": total_chunks,
        "autonomous_brain_topics": len(brain_nodes),
        "total_turns_learned": brain_stats.get("total_turns_learned", len(brain_nodes)),
        "total_evolutions": brain_stats.get("total_evolutions", 0),
        "last_learned_topic": brain_stats.get("last_learned_topic", ""),
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
            vault = {"documents": {}, "chunks": [], "brain_stats": {"total_turns_learned": 0, "total_evolutions": 0}}
            _save_vault(vault)
            return True
