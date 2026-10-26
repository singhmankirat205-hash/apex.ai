"""
APEX Memory Engine — Continuous Long-Term Cross-Session Memory & Self-Evolving AI Brain
=======================================================================================
Maintains continuous enterprise, encyclopedic, and operational memory across chat sessions:
- User profile, operating role & human command preferences
- Autonomous self-learned topics from every prompt, multi-source web harvest, and answer
- Active manufacturing facilities & production lines
- Monitored batches & quality history
- Key machinery & calibration states
- Learned operational preferences & past decisions

Stores persistent state in `data/memory/long_term_memory.json`.
"""
from __future__ import annotations
import json
import logging
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("apex.memory")

_ROOT = Path(__file__).resolve().parent.parent
_MEMORY_DIR = _ROOT / "data" / "memory"
_MEMORY_FILE = _MEMORY_DIR / "long_term_memory.json"
_LOCK = threading.Lock()

_DEFAULT_MEMORY: Dict[str, Any] = {
    "user_profile": {
        "title": "Industrial Operations & Universal Intelligence Director",
        "current_industry": "textile",
        "preferred_role": "OPERATOR",
        "tone_preference": "Action-oriented, authoritative, deeply knowledgeable across all domains, strictly obedient to human commands",
        "last_active": "2026-10-26T10:30:00Z"
    },
    "enterprise_context": {
        "primary_facility": "Apex Mills — Plant 1 (Weaving & Wet Finishing Complex)",
        "production_lines": ["Line 4 High-Speed Airjet Shed", "Finishing Stenter Line 2"],
        "critical_machinery": [
            {
                "machine_id": "Picanol OmniPlus-i Airjet #04",
                "type": "Airjet Weaving Loom",
                "status": "MONITORED",
                "last_event": "Weft feeler sensitivity adjustment scheduled (MNT-2026-104)"
            },
            {
                "machine_id": "Monforts Montex 8500 Stenter #02",
                "type": "Finishing Stenter Frame",
                "status": "OPERATIONAL",
                "last_event": "Temperature drift verification passed"
            },
            {
                "machine_id": "Datacolor 800 Benchtop Spectrophotometer",
                "type": "Color QC Instrument",
                "status": "CALIBRATED",
                "last_event": "Delta E tolerance set to max 1.0 (CMC 2:1)"
            }
        ],
        "active_batches": [
            {
                "batch_id": "BT-904",
                "fabric_type": "100% Ring Spun Cotton Twill 3/1",
                "status": "QUARANTINE_HOLD",
                "latest_defect": "Broken Pick (4 ASTM penalty points)",
                "assigned_inspector": "Shift Lead Alex R.",
                "action_taken": "Automated QC record QC-2026-0904 logged & maintenance booked"
            },
            {
                "batch_id": "BT-881",
                "fabric_type": "Polyester Microfiber Interlock",
                "status": "PASSED_GRADE_A",
                "latest_defect": "Minor selvedge shade variation (resolved)",
                "assigned_inspector": "Lead Chemist Priya M.",
                "action_taken": "Released to garment cutting"
            }
        ],
        "quality_standards": [
            "ASTM D5430 4-Point Fabric Inspection System",
            "AATCC Color Fastness & Delta E CMC 2:1 Standard",
            "ISO 9001:2015 Quality Management System",
            "cGMP 21 CFR Part 211 (Pharma division standard)"
        ]
    },
    "session_milestones": [
        {
            "timestamp": "2026-10-03T10:15:00Z",
            "note": "Audited Batch #BT-904 for broken pick weft fault; flagged 4 penalty points under ASTM D5430."
        },
        {
            "timestamp": "2026-10-03T11:20:00Z",
            "note": "Committed maintenance booking MNT-2026-104 for Loom #04 optical sensor recalibration."
        },
        {
            "timestamp": "2026-10-03T12:05:00Z",
            "note": "Connected interactive Chart.js visualization engine with Pareto defect analysis."
        }
    ],
    "learned_preferences": [
        "Strictly obey the human user's exact command boundaries while applying universal knowledge of everything.",
        "Continuously self-learn after every prompt and answer to deliver deeper, improved answers next time.",
        "Use clean Unicode mathematical formulas without raw LaTeX symbols ($ or \\text)."
    ],
    "learned_facts": [],
    "self_learned_topics": [],
    "brain_telemetry": {
        "total_prompts_learned": 0,
        "total_answer_evolutions": 0,
        "active_knowledge_sources": [
            "Wikipedia REST & Search Encyclopedia",
            "DuckDuckGo Instant Knowledge Graph",
            "Google News Live Global RSS",
            "ArXiv Peer-Reviewed Scientific Papers",
            "StackExchange Technical & Coding Q&A",
            "HackerNews Algolia Tech Intelligence",
            "TEXO Post-Answer Self-Reflection Engine"
        ]
    }
}


def _ensure_memory() -> Dict[str, Any]:
    """Load memory from disk or initialize default enterprise memory."""
    if not _MEMORY_FILE.exists():
        _MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        with open(_MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(_DEFAULT_MEMORY, f, indent=2)
        return _DEFAULT_MEMORY.copy()
    try:
        with open(_MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if "self_learned_topics" not in data:
                data["self_learned_topics"] = []
            if "brain_telemetry" not in data:
                data["brain_telemetry"] = _DEFAULT_MEMORY["brain_telemetry"].copy()
            return data
    except Exception as e:
        logger.error("Error reading memory file, reverting to default: %s", e)
        return _DEFAULT_MEMORY.copy()


def _save_memory(data: Dict[str, Any]) -> None:
    """Save memory atomically to disk."""
    _MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = _MEMORY_FILE.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    tmp_path.replace(_MEMORY_FILE)


def get_memory() -> Dict[str, Any]:
    """Retrieve full long-term memory."""
    with _LOCK:
        return _ensure_memory()


def update_memory_profile(industry: Optional[str] = None, role: Optional[str] = None) -> None:
    """Update active user role and industry in persistent memory."""
    with _LOCK:
        mem = _ensure_memory()
        now_iso = datetime.now(timezone.utc).isoformat()
        if "user_profile" not in mem:
            mem["user_profile"] = {}
        if industry:
            mem["user_profile"]["current_industry"] = industry
        if role:
            mem["user_profile"]["preferred_role"] = role
        mem["user_profile"]["last_active"] = now_iso
        _save_memory(mem)


def record_session_milestone(action_note: str) -> None:
    """Add a completed milestone or decision to persistent long-term memory."""
    with _LOCK:
        mem = _ensure_memory()
        milestones = mem.setdefault("session_milestones", [])
        milestones.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": action_note
        })
        if len(milestones) > 50:
            mem["session_milestones"] = milestones[-50:]
        _save_memory(mem)


def update_batch_memory(batch_id: str, updates: Dict[str, Any]) -> None:
    """Upsert monitored batch state in continuous memory."""
    with _LOCK:
        mem = _ensure_memory()
        batches = mem.setdefault("enterprise_context", {}).setdefault("active_batches", [])
        found = False
        for b in batches:
            if b.get("batch_id") == batch_id:
                b.update(updates)
                found = True
                break
        if not found:
            batches.append({"batch_id": batch_id, **updates})
        _save_memory(mem)


def auto_learn_from_dialogue(
    user_text: str,
    assistant_text: str,
    multi_source_dossier: str = "",
    learned_turn_meta: Optional[Dict[str, Any]] = None
) -> None:
    """
    Autonomous Self-Learning Pipeline (Post-Turn Brain Consolidation):
    1. Extracts operational entities, preferences, and human command rules from `user_text`.
    2. Distills key facts and topic mastery from `assistant_text` and `multi_source_dossier`
       into `self_learned_topics` and `learned_facts`.
    3. Updates `brain_telemetry` counters so TEXO continuously evolves after every single prompt.
    """
    if not user_text or len(user_text.strip()) < 3:
        return

    with _LOCK:
        mem = _ensure_memory()
        dirty = False
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Batch ID extraction
        batch_matches = re.findall(r'\b(?:Batch|Lot|Roll)\s*#?\s*([A-Za-z0-9\-]{3,12})\b', user_text, re.IGNORECASE)
        for b_id in set(batch_matches):
            b_norm = f"BT-{b_id}" if not b_id.upper().startswith(("BT", "LOT", "ROL")) else b_id.upper()
            batches = mem.setdefault("enterprise_context", {}).setdefault("active_batches", [])
            if not any(b.get("batch_id") == b_norm for b in batches):
                batches.append({
                    "batch_id": b_norm,
                    "status": "ACTIVE_MONITORING",
                    "noted_at": now_iso,
                    "source": "Discovered from user dialogue"
                })
                dirty = True

        # 2. Machine ID extraction
        machine_matches = re.findall(r'\b(?:Loom|Machine|Line|Stenter|Unit|Reactor|Autoclave)\s*#?\s*([A-Za-z0-9\-]{1,8})\b', user_text, re.IGNORECASE)
        for m_id in set(machine_matches):
            machines = mem.setdefault("enterprise_context", {}).setdefault("critical_machinery", [])
            m_label = f"Unit #{m_id.upper()}"
            if not any(m_id.lower() in m.get("machine_id", "").lower() for m in machines):
                machines.append({
                    "machine_id": m_label,
                    "type": "Plant Equipment",
                    "status": "ACTIVE",
                    "last_event": f"Referenced in active session ({datetime.now().strftime('%Y-%m-%d')})"
                })
                dirty = True

        # 3. Explicit preferences & human command rules
        pref_matches = re.findall(
            r'\b(?:we prefer|always remember|our tolerance is|my name is|from now on|our rule is|in our mill|in our company|we always|never forget|note that|keep in mind|dont show|do not show|just give|always give)\s+([^.!?\n]+)',
            user_text,
            re.IGNORECASE
        )
        prefs = mem.setdefault("learned_preferences", [])
        for pm in pref_matches:
            clean_pm = pm.strip()
            if len(clean_pm) > 4 and clean_pm not in prefs:
                prefs.append(clean_pm)
                if len(prefs) > 35:
                    mem["learned_preferences"] = prefs[-35:]
                dirty = True

        # 4. Declarative organizational facts & enterprise knowledge
        fact_patterns = [
            r'(\b(?:our|my)\s+(?:[a-zA-Z0-9_\-\s]{0,20})?(?:company|ceo|founder|director|factory|plant|mill|supplier|customer|client|headquarters|location|standard|product|brand|target|gsm|tolerance)\s+(?:is|are|located in|uses?)\s+[^.!?\n]+)',
            r'(\b(?:standard|target|minimum|maximum|moq|gsm|lead time|capacity|tolerance)\s+(?:is|set to|should be)\s+[^.!?\n]+)',
            r'(\b(?:rule|fact|policy|instruction|note):\s*[^.!?\n]+)'
        ]
        facts = mem.setdefault("learned_facts", [])
        for pat in fact_patterns:
            matches = re.findall(pat, user_text, re.IGNORECASE)
            for m in matches:
                clean_f = m.strip() if isinstance(m, str) else m[0].strip()
                clean_f = re.sub(r'^(?:and|also|that|plus)\s+', '', clean_f, flags=re.IGNORECASE).strip()
                if len(clean_f) > 8:
                    fact_entry = {
                        "fact": clean_f,
                        "timestamp": now_iso,
                        "source": "Autonomous dialogue capture"
                    }
                    if not any(f.get("fact", "").lower() == clean_f.lower() for f in facts):
                        facts.append(fact_entry)
                        if len(facts) > 60:
                            mem["learned_facts"] = facts[-60:]
                        dirty = True

        # 5. Autonomous Post-Answer & Multi-Source Topic Learning
        if assistant_text and len(assistant_text.strip()) >= 30:
            clean_ans = re.sub(r'```[\s\S]*?```', '', assistant_text).strip()
            ans_lines = [
                re.sub(r'^(?:[#*>•\-\+]|\d+\.)\s*', '', ln).strip()
                for ln in clean_ans.splitlines()
                if len(ln.strip()) > 25 and not ln.strip().startswith('|---')
            ]
            top_takeaway = ans_lines[0][:220] if ans_lines else clean_ans[:220]
            topic_name = (learned_turn_meta or {}).get("topic") or re.sub(r'[^\w\s\-]', '', user_text.strip())[:55].strip()
            gen_num = int((learned_turn_meta or {}).get("generation", 1))
            sources_used = (learned_turn_meta or {}).get("sources", ["Multi-Source AI Brain"])

            if topic_name and len(topic_name) >= 2:
                topics = mem.setdefault("self_learned_topics", [])
                existing_idx = next(
                    (i for i, t in enumerate(topics) if t.get("topic", "").lower() == topic_name.lower()),
                    None
                )
                topic_entry = {
                    "topic": topic_name,
                    "generation": gen_num,
                    "sources": sources_used[:6],
                    "key_takeaway": top_takeaway,
                    "last_prompt": user_text.strip()[:120],
                    "updated_at": now_iso
                }
                if existing_idx is not None:
                    topics[existing_idx] = topic_entry
                else:
                    topics.append(topic_entry)
                if len(topics) > 60:
                    mem["self_learned_topics"] = topics[-60:]

                # Also add the top quantitative fact from the answer to learned_facts
                for ln in ans_lines[:4]:
                    if re.search(r'\b\d+(?:\.\d+)?\s*(?:%|°C|MPa|PSI|bar|mm|km|kg|Hz|kW|GSM|USD|\$|years?|days?)\b', ln, re.I) or '=' in ln:
                        fact_str = f"[{topic_name.title()}] {ln[:180]}"
                        if not any(f.get("fact", "").lower() == fact_str.lower() for f in facts):
                            facts.append({
                                "fact": fact_str,
                                "timestamp": now_iso,
                                "source": f"Self-Learned (Gen #{gen_num})"
                            })
                            if len(facts) > 60:
                                mem["learned_facts"] = facts[-60:]
                        break

                telem = mem.setdefault("brain_telemetry", {})
                telem["total_prompts_learned"] = int(telem.get("total_prompts_learned", 0)) + 1
                if gen_num > 1:
                    telem["total_answer_evolutions"] = int(telem.get("total_answer_evolutions", 0)) + 1
                telem["last_learned_topic"] = topic_name
                telem["last_updated"] = now_iso
                dirty = True

        if dirty:
            _save_memory(mem)
            logger.info("APEX Self-Learning Brain Memory updated (topic='%s').", (learned_turn_meta or {}).get("topic", user_text[:30]))


def get_memory_prompt_context() -> str:
    """
    Format a concise, authoritative briefing from continuous long-term memory
    and autonomous self-learned topics to inject into TEXO's system prompt.
    """
    mem = get_memory()
    ent = mem.get("enterprise_context", {})
    batches = ent.get("active_batches", [])
    machinery = ent.get("critical_machinery", [])
    milestones = mem.get("session_milestones", [])[-3:]
    prefs = mem.get("learned_preferences", [])[-6:]
    facts = mem.get("learned_facts", [])[-8:]
    learned_topics = mem.get("self_learned_topics", [])[-8:]
    telem = mem.get("brain_telemetry", {})

    lines = [
        "══════════════════════════════════════════════════════════════════════════════",
        "CONTINUOUS SELF-LEARNING AI BRAIN & CROSS-SESSION MEMORY STATE",
        "══════════════════════════════════════════════════════════════════════════════",
        f"• Autonomous Brain Telemetry: {telem.get('total_prompts_learned', len(learned_topics))} prompts self-learned | "
        f"{telem.get('total_answer_evolutions', 0)} multi-turn answer evolutions completed",
        f"• Facility Context (when textile/manufacturing active): {ent.get('primary_facility', 'Apex Production Complex')}",
    ]

    if learned_topics:
        lines.append("• Recently Self-Learned Knowledge Domains & Generation Level:")
        for lt in reversed(learned_topics):
            srcs = ", ".join(lt.get("sources", [])[:3])
            lines.append(
                f"  - Topic '{lt.get('topic')}' [Gen #{lt.get('generation', 1)} via {srcs}]: {lt.get('key_takeaway', '')[:140]}"
            )

    if facts:
        lines.append("• Autonomously Learned Facts, Metrics & Rules:")
        for f in facts:
            lines.append(f"  - {f.get('fact')}")

    if prefs:
        lines.append("• Human Command Boundaries & Learned User Preferences:")
        for p in prefs:
            lines.append(f"  - {p}")

    if batches:
        b_strs = [f"#{b.get('batch_id')} ({b.get('status', 'Active')}: {b.get('latest_defect', b.get('fabric_type', 'General'))})" for b in batches[:3]]
        lines.append(f"• Monitored Batches: {'; '.join(b_strs)}")

    if machinery:
        m_strs = [f"{m.get('machine_id')} [{m.get('status', 'OK')}]" for m in machinery[:3]]
        lines.append(f"• Active Equipment: {'; '.join(m_strs)}")

    if milestones:
        lines.append("• Recent Cross-Session Milestones:")
        for ms in milestones:
            lines.append(f"  - [{ms.get('timestamp', '')[:10]}] {ms.get('note')}")

    lines.append(
        "CRITICAL AUTONOMOUS SELF-LEARNING INSTRUCTION: You are an ever-evolving AI Brain with universal knowledge of everything, "
        "strictly bounded by the human user's command. Whenever answering a topic you have already learned above or in the Knowledge Vault, "
        "automatically build upon your prior answer to deliver an even smarter, deeper, and more informative response next time!"
    )
    return "\n".join(lines)
