"""
Plant Tools — with local memory (auto-learning)
================================================
Every log_case() writes to data/plant_memory.json.
get_similar_cases() searches that file first, so APEX
learns from every case your team enters.
"""
from __future__ import annotations
import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

# ── Memory file path ──────────────────────────────────────────────────────────
_ROOT  = Path(__file__).resolve().parent.parent.parent  # project root
_MEMORY = _ROOT / "data" / "plant_memory.json"
_LOCK  = threading.Lock()

def _load_memory() -> dict:
    try:
        with open(_MEMORY, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"cases": [], "image_labels": [], "batch_outcomes": [], "machine_history": {}}

def _save_memory(mem: dict) -> None:
    _MEMORY.parent.mkdir(parents=True, exist_ok=True)
    with open(_MEMORY, "w", encoding="utf-8") as f:
        json.dump(mem, f, indent=2, default=str)

# ── Tool functions ────────────────────────────────────────────────────────────

def get_batch(batch_id: str) -> dict:
    """Fetch process, machine, dye-bath and order data for a batch."""
    # TODO: Replace with real DB/API call
    # Example: return requests.get(f"{BASE_URL}/batches/{batch_id}").json()
    mem = _load_memory()
    outcome = next((b for b in mem.get("batch_outcomes", []) if b.get("batch_id") == batch_id), None)
    stub = {
        "batch_id": batch_id,
        "status": "stub — connect your plant DB",
        "fabric_type": "cotton",
        "machine_id": "LOOM-01",
        "dye_class": "reactive",
        "shift": "day",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if outcome:
        stub["previous_outcome"] = outcome
    return stub


def get_machine_status(machine_id: str) -> dict:
    """Fetch vibration, bearing temp, hours since maintenance and open tickets."""
    # TODO: Replace with real sensor API
    mem = _load_memory()
    history = mem.get("machine_history", {}).get(machine_id, [])
    return {
        "machine_id": machine_id,
        "status": "stub — connect your SCADA/sensor API",
        "vibration_mm_s": None,
        "bearing_temp_c": None,
        "hours_since_maintenance": None,
        "open_tickets": [],
        "past_cases_count": len([c for c in mem.get("cases", []) if c.get("machine_id") == machine_id]),
        "recent_defects": history[-3:] if history else [],
        "note": "Real sensor data requires connecting get_machine_status() in plant_tools.py",
    }


def get_buyer_spec(buyer_id: str, fabric_type: str) -> dict:
    """Fetch buyer-specific Delta E limit, GSM tolerance and defect-point limits."""
    # TODO: Replace with real buyer DB
    return {
        "buyer_id": buyer_id,
        "fabric_type": fabric_type,
        "delta_e_limit": 1.5,
        "gsm_tolerance_pct": 5.0,
        "defect_points_per_100m_limit": 40,
        "note": "Stub — connect get_buyer_spec() to your buyer database.",
    }


def get_dye_optimum(fabric_type: str, dye_class: str) -> dict:
    """Fetch approved dye parameter ranges for a fabric and dye class."""
    presets = {
        ("cotton", "reactive"):   {"temp_c": (55, 60), "ph": (10.5, 11.5), "liquor_ratio": "1:10"},
        ("polyester", "disperse"):{"temp_c": (125, 135), "ph": (4.5, 5.5), "liquor_ratio": "1:8"},
        ("viscose", "reactive"):  {"temp_c": (50, 60), "ph": (10.5, 11.0), "liquor_ratio": "1:12"},
    }
    key = (fabric_type.lower(), dye_class.lower())
    params = presets.get(key, {"note": "No preset — add to get_dye_optimum() in plant_tools.py"})
    return {"fabric_type": fabric_type, "dye_class": dye_class, **params}


def predict_rejection(batch_inputs: dict) -> dict:
    """Predict pre-inspection rejection risk using learned patterns."""
    mem   = _load_memory()
    cases = mem.get("cases", [])

    # Simple heuristic + learned pattern scoring
    score = 0
    drivers = []

    temp = batch_inputs.get("dye_bath_temp_c")
    if temp:
        try:
            temp = float(temp)
            if temp > 110:
                score += 30; drivers.append(f"High dye temp ({temp}°C)")
            elif temp < 50:
                score += 20; drivers.append(f"Low dye temp ({temp}°C)")
        except (ValueError, TypeError):
            pass

    vib = batch_inputs.get("vibration_mm_s")
    if vib:
        try:
            if float(vib) > 6:
                score += 25; drivers.append(f"High vibration ({vib} mm/s)")
        except (ValueError, TypeError):
            pass

    shift = batch_inputs.get("shift", "").lower()
    if "night" in shift:
        score += 10; drivers.append("Night shift (historically higher rejection)")

    fabric = batch_inputs.get("fabric_type", "").lower()
    if "viscose" in fabric:
        score += 10; drivers.append("Viscose (higher sensitivity)")

    hrs = batch_inputs.get("hours_since_maintenance")
    if hrs:
        try:
            if float(hrs) > 500:
                score += 15; drivers.append(f"Overdue maintenance ({hrs}h)")
        except (ValueError, TypeError):
            pass

    # Boost from learned cases
    machine = batch_inputs.get("machine_id", "")
    if machine and cases:
        recent_fails = [c for c in cases[-50:]
                        if c.get("machine_id") == machine and c.get("outcome") in ("rejected","rework")]
        if len(recent_fails) >= 2:
            score += 15; drivers.append(f"Machine {machine} has {len(recent_fails)} recent failures in memory")

    band = "Low" if score < 30 else ("Medium" if score < 55 else "High")
    return {
        "probability_band": band,
        "score": score,
        "top_drivers": drivers[:4] if drivers else ["No risk factors identified from available data"],
        "model_version": "APEX-heuristic-v1 + plant-memory",
        "learned_cases_used": len(cases),
        "note": "Replace with ML model by wiring predict_rejection() in plant_tools.py",
    }


def get_similar_cases(defect: str, machine: str, fabric: str) -> dict:
    """Search plant memory for similar past cases — improves with every logged case."""
    mem   = _load_memory()
    cases = mem.get("cases", [])
    if not cases:
        return {"similar_cases": [], "count": 0,
                "note": "No cases in memory yet. Cases are saved automatically after each APEX diagnosis."}

    defect_lower  = defect.lower()
    machine_lower = machine.lower()
    fabric_lower  = fabric.lower()

    matches = []
    for c in cases:
        score = 0
        if defect_lower  and defect_lower  in str(c.get("defect_type","")).lower():  score += 3
        if machine_lower and machine_lower in str(c.get("machine_id","")).lower():    score += 2
        if fabric_lower  and fabric_lower  in str(c.get("fabric_type","")).lower():  score += 1
        if score > 0:
            matches.append({**c, "_match_score": score})

    matches.sort(key=lambda x: x["_match_score"], reverse=True)
    top = matches[:5]

    return {
        "similar_cases": top,
        "count": len(top),
        "total_in_memory": len(cases),
        "note": f"Searched {len(cases)} stored cases. Memory grows with every log_case() call.",
    }


def log_case(case_json: dict) -> dict:
    """Save a quality case to plant memory — this is how APEX learns."""
    with _LOCK:
        mem = _load_memory()
        case = {
            "case_id":    f"APEX-{len(mem['cases'])+1:04d}",
            "logged_at":  datetime.now(timezone.utc).isoformat(),
            **case_json,
        }
        mem["cases"].append(case)

        # Update machine history index
        mid = case_json.get("machine_id")
        if mid:
            mem.setdefault("machine_history", {}).setdefault(mid, [])
            mem["machine_history"][mid].append({
                "case_id":    case["case_id"],
                "defect":     case_json.get("defect_type"),
                "outcome":    case_json.get("outcome"),
                "logged_at":  case["logged_at"],
            })
        _save_memory(mem)

    return {"status": "saved", "case_id": case["case_id"],
            "total_cases_in_memory": len(mem["cases"])}


def escalate(to_role: str, urgency: str, summary: str) -> dict:
    """Log escalation — wire to your notification system (SMS/email/Teams)."""
    # TODO: Connect to your plant alerting system
    # e.g. requests.post(ALERT_URL, json={"to": to_role, "urgency": urgency, "msg": summary})
    print(f"🚨 ESCALATION [{urgency.upper()}] → {to_role}: {summary}")
    return {"status": "escalated (stub)", "to_role": to_role, "urgency": urgency,
            "note": "Wire escalate() to your SMS/email/Teams webhook in plant_tools.py"}


def stop_line_request(machine_id: str, reason: str) -> dict:
    """Send a line-stop request to supervisor (does NOT stop machine directly)."""
    # TODO: Connect to your MES/supervisor alert system
    print(f"🛑 STOP REQUEST: Machine {machine_id} — {reason}")
    return {"status": "stop_request_sent (stub)", "machine_id": machine_id, "reason": reason,
            "note": "Wire stop_line_request() to your MES/supervisor alert system"}


def save_image_label(image_hash: str, defect_type: str, fabric_type: str,
                     machine_id: str = "", confirmed_by: str = "") -> dict:
    """Save an image classification to memory for future learning."""
    with _LOCK:
        mem = _load_memory()
        entry = {
            "image_hash":   image_hash,
            "defect_type":  defect_type,
            "fabric_type":  fabric_type,
            "machine_id":   machine_id,
            "confirmed_by": confirmed_by,
            "logged_at":    datetime.now(timezone.utc).isoformat(),
        }
        mem.setdefault("image_labels", []).append(entry)
        _save_memory(mem)
    return {"status": "saved", "total_image_labels": len(mem["image_labels"])}


# ── Tool dispatch map ─────────────────────────────────────────────────────────
TOOL_FUNCTIONS = {
    "get_batch":           get_batch,
    "get_machine_status":  get_machine_status,
    "get_buyer_spec":      get_buyer_spec,
    "get_dye_optimum":     get_dye_optimum,
    "predict_rejection":   predict_rejection,
    "get_similar_cases":   get_similar_cases,
    "log_case":            log_case,
    "escalate":            escalate,
    "stop_line_request":   stop_line_request,
    "save_image_label":    save_image_label,
}
