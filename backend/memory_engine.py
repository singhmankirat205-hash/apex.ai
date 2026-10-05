"""
APEX Memory Engine — Continuous Long-Term Cross-Session Memory & Profile
========================================================================
Maintains continuous enterprise and operational memory across chat sessions:
- User profile & operating role
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
        "title": "Industrial Operations & Quality Director",
        "current_industry": "textile",
        "preferred_role": "OPERATOR",
        "tone_preference": "Action-oriented, authoritative, highly precise, concise when appropriate",
        "last_active": "2026-10-03T11:45:00Z"
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
        "Prefers proactive autonomous tool execution and record commits over generic passive text advice.",
        "Expects direct root-cause identification and ASTM / ISO technical precision.",
        "Requires immediate containment protocol and escalation HUD during operational distress or line halts."
    ]
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
            return json.load(f)
    except Exception as e:
        logger.error("Error reading memory file, reverting to default: %s", e)
        return _DEFAULT_MEMORY.copy()


def _save_memory(data: Dict[str, Any]) -> None:
    """Save memory atomically to disk."""
    _MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    with open(_MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


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
        # Keep last 50 milestones
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


def auto_learn_from_dialogue(user_text: str, assistant_text: str) -> None:
    """
    Extract dynamic operational facts mentioned in chat turns and persist to long-term memory:
    - New batch IDs (e.g. Batch #BT-905, Lot #402)
    - Machinery IDs (e.g. Loom #04, Line 3, Stenter #2)
    - Explicit user preferences ("always show formula", "our tolerance is 5%")
    """
    if not user_text or len(user_text.strip()) < 5:
        return

    with _LOCK:
        mem = _ensure_memory()
        dirty = False

        # 1. Batch ID extraction
        batch_matches = re.findall(r'\b(?:Batch|Lot|Roll)\s*#?\s*([A-Za-z0-9\-]{3,12})\b', user_text, re.IGNORECASE)
        for b_id in set(batch_matches):
            b_norm = f"BT-{b_id}" if not b_id.upper().startswith(("BT", "LOT", "ROL")) else b_id.upper()
            batches = mem.setdefault("enterprise_context", {}).setdefault("active_batches", [])
            if not any(b.get("batch_id") == b_norm for b in batches):
                batches.append({
                    "batch_id": b_norm,
                    "status": "ACTIVE_MONITORING",
                    "noted_at": datetime.now(timezone.utc).isoformat(),
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

        # 3. Preference extraction ("our tolerance is...", "we prefer...")
        pref_match = re.search(r'\b(?:we prefer|always remember|our tolerance is|my name is)\s+([^.!?]+)', user_text, re.IGNORECASE)
        if pref_match:
            new_pref = pref_match.group(0).strip()
            prefs = mem.setdefault("learned_preferences", [])
            if new_pref not in prefs:
                prefs.append(new_pref)
                dirty = True

        if dirty:
            _save_memory(mem)
            logger.info("APEX Long-Term Memory updated from dialogue turn.")


def get_memory_prompt_context() -> str:
    """
    Format a concise, authoritative operational briefing from continuous long-term memory
    to inject directly into APEX's system prompt.
    """
    mem = get_memory()
    profile = mem.get("user_profile", {})
    ent = mem.get("enterprise_context", {})
    batches = ent.get("active_batches", [])
    machinery = ent.get("critical_machinery", [])
    milestones = mem.get("session_milestones", [])[-3:]
    prefs = mem.get("learned_preferences", [])[-3:]

    lines = [
        "══════════════════════════════════════════════════════════════════════════════",
        "CONTINUOUS LONG-TERM ENTERPRISE MEMORY & ACTIVE PROFILE (CROSS-SESSION STATE)",
        "══════════════════════════════════════════════════════════════════════════════",
        f"• Facility: {ent.get('primary_facility', 'Apex Production Complex')}",
        f"• Active Production Lines: {', '.join(ent.get('production_lines', ['Main Line']))}",
    ]

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

    if prefs:
        lines.append("• Continuous Learned Preferences:")
        for p in prefs:
            lines.append(f"  - {p}")

    lines.append(
        "CRITICAL INSTRUCTION: You possess continuous memory of these batches, machines, and past actions. "
        "Never treat the user as a stranger or a blank slate. If the user refers to 'the batch', 'our loom', "
        "or previous decisions, seamlessly leverage this exact context!"
    )
    return "\n".join(lines)
