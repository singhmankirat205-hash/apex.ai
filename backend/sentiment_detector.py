"""
APEX Sentiment & Operational Tone Detector
=========================================
Analyzes incoming user prompts in real time to detect:
- User frustration, exasperation, or anger
- Critical plant emergencies, line stops, or operational crises
- Urgency signals (boss pressure, customer cancellation threats, severe defects)

Generates dynamic empathy prompts and escalation protocol directives.
"""
from __future__ import annotations
import re
from typing import Dict, List, Tuple

# Trigger keywords for high user frustration
_FRUSTRATION_KEYWORDS = [
    "angry", "furious", "annoyed", "frustrated", "frustrating", "sick of", "tired of",
    "useless", "stupid", "idiot", "waste of time", "nonsense", "garbage", "rubbish",
    "stop giving instructions", "stop talking", "just do it", "do something", "fix this now",
    "failing", "failed again", "horrible", "terrible", "worst", "unacceptable"
]

# Trigger keywords for critical plant/operational crises
_CRISIS_KEYWORDS = [
    "shut down", "shutdown", "stop the line", "line is down", "line stopped", "production halt",
    "broken down", "breakdown", "disaster", "catastrophe", "fire", "smoke", "hazard", "explosion",
    "emergency", "urgent", "critical", "boss is angry", "boss is mad", "boss is furious",
    "client rejected", "client threatening", "cancelled order", "penalty", "lawsuit", "audit failure"
]


def detect_tone(user_text: str) -> Dict[str, any]:
    """
    Evaluate user message for frustration, panic, or operational crisis.
    Returns analysis dict with escalation guidance.
    """
    if not user_text:
        return {"frustration_level": "NORMAL", "is_crisis": False, "instructions": ""}

    text_lower = user_text.lower()
    triggers_frustration: List[str] = [k for k in _FRUSTRATION_KEYWORDS if k in text_lower]
    triggers_crisis: List[str] = [k for k in _CRISIS_KEYWORDS if k in text_lower]

    # Check for excessive exclamation marks or all-caps shouting
    words = user_text.split()
    caps_count = sum(1 for w in words if w.isupper() and len(w) > 2)
    has_shouting = (caps_count >= 3 and len(words) >= 4)
    has_exclamations = ("!!!" in user_text or "?!" in user_text)

    is_frustrated = (len(triggers_frustration) >= 1) or has_shouting or has_exclamations
    is_crisis = (len(triggers_crisis) >= 1)

    if not is_frustrated and not is_crisis:
        return {
            "frustration_level": "NORMAL",
            "is_crisis": False,
            "triggers": [],
            "instructions": ""
        }

    level = "CRITICAL_CRISIS" if is_crisis and is_frustrated else ("CRITICAL_CRISIS" if is_crisis else "HIGH_FRUSTRATION")
    all_triggers = triggers_frustration + triggers_crisis
    if has_shouting:
        all_triggers.append("ALL_CAPS_EMPHASIS")
    if has_exclamations:
        all_triggers.append("EXCLAMATION_PUNCTUATION")

    instructions = f"""
[🚨 REAL-TIME TONE & SENTIMENT TRIGGER DETECTED: {level}]
The user is experiencing heightened operational stress, frustration, or urgent production distress.
Detected Triggers: {', '.join(all_triggers[:5])}

MANDATORY BEHAVIORAL & EMPATHY ADAPTATION:
1. PIVOT IMMEDIATELY TO HIGH-EMPATHY, CALM, ZERO-DEFENSIVENESS OWNERSHIP:
   - Do NOT give generic apologies or repetitive filler ("I apologize for the inconvenience as an AI...").
   - Acknowledge the gravity with steady authority: e.g., "Understood. I am stepping in directly right now to contain this and resolve the issue without friction."
2. BE ULTRA-CONCISE & ACTION-FIRST:
   - Skip introductory pleasantries and cut straight to immediate operational containment.
   - Provide 3 rapid, prioritized triage steps (1. Immediate Freeze/Containment, 2. Root Isolation, 3. Recovery).
3. AUTONOMOUS TOOL ASSIGNMENT & EXECUTION:
   - When a problem or defect is reported, do NOT just say "you should log this" — EXECUTE THE ACTION YOURSELF using a ```action ... ``` block to update the record, schedule emergency maintenance, or run a quarantine workflow!
4. EMIT AN ESCALATION HUD BLOCK:
   - Output an escalation block in this exact schema to trigger the Glowing Priority Containment HUD:
   ```escalation
   {{
     "alert_level": "{"CRITICAL / SEV-1" if is_crisis else "HIGH / PRIORITY"}",
     "status": "CONTAINMENT_DISPATCHED",
     "trigger": "User distress regarding: {user_text[:60].replace('"', '')}...",
     "containment_steps": [
       "Immediate production hold / equipment isolation initiated",
       "Dispatched priority containment ticket to plant engineering",
       "Batch quarantined in operations database"
     ],
     "assigned_lead": "Shift Operations Lead & Senior Quality Specialist",
     "eta_intervention": "Immediate (Active Intervention Mode)",
     "hotline_contact": "APEX Plant Operations Channel 1 / Lead Dispatch"
   }}
   ```
"""
    return {
        "frustration_level": level,
        "is_crisis": is_crisis,
        "is_frustrated": is_frustrated,
        "triggers": all_triggers,
        "instructions": instructions.strip()
    }
