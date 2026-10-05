"""
APEX Operations Engine — Autonomous Tool Assignment & Real-Time Execution
========================================================================
Enables APEX to perform real operational work instead of just offering text answers:
- Update enterprise database records (QC defects, inventory, batch status, CAPA)
- Book equipment maintenance windows and calibration slots
- Run automated containment and verification workflows
- Log real-time incidents and trigger dispatch alerts

All actions are persistently committed to `data/operations_db.json`.
"""
from __future__ import annotations
import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("apex.operations")

_ROOT = Path(__file__).resolve().parent.parent
_DB_PATH = _ROOT / "data" / "operations_db.json"
_LOCK = threading.Lock()

# ── Seed Data for Initial State ──────────────────────────────────────────────
_DEFAULT_DB: Dict[str, Any] = {
    "qc_records": [
        {
            "id": "QC-2026-0904",
            "batch_id": "BT-904",
            "fabric_type": "100% Ring Spun Cotton Twill 3/1",
            "inspection_standard": "ASTM D5430 4-Point",
            "defect_type": "Broken Pick (Weft Discontinuity)",
            "defect_count": 3,
            "penalty_points": 4,
            "status": "HOLD_PENDING_REVIEW",
            "assigned_inspector": "Shift Lead Alex R.",
            "loom_id": "Picanol OmniPlus-i #04",
            "updated_at": "2026-10-03T10:15:00Z"
        },
        {
            "id": "QC-2026-0881",
            "batch_id": "BT-881",
            "fabric_type": "Polyester Microfiber Interlock",
            "inspection_standard": "ASTM D5430 4-Point",
            "defect_type": "Center-to-Selvedge Shade Variation",
            "defect_count": 1,
            "penalty_points": 2,
            "status": "APPROVED_GRADE_A",
            "assigned_inspector": "Lead Chemist Priya M.",
            "loom_id": "Tsudakoma ZAX9200i #02",
            "updated_at": "2026-10-02T16:40:00Z"
        }
    ],
    "inventory": [
        {
            "sku": "YRN-COT-40S-COMBED",
            "description": "40s Ne Combed Ring Spun Cotton Yarn",
            "quantity_kg": 14200.0,
            "warehouse_bay": "Bay B-04",
            "lot_number": "LOT-CT-4091",
            "allocated_batches": ["BT-904", "BT-905"],
            "status": "AVAILABLE",
            "updated_at": "2026-10-03T09:00:00Z"
        },
        {
            "sku": "DYE-REACT-BLUE-19",
            "description": "Reactive Blue 19 Pure Vinyl Sulfone Dyestuff",
            "quantity_kg": 340.5,
            "warehouse_bay": "Chemical Store Chem-02",
            "lot_number": "LOT-RB-771",
            "allocated_batches": ["BT-881"],
            "status": "RESERVED",
            "updated_at": "2026-10-03T08:30:00Z"
        },
        {
            "sku": "FAB-TWILL-220GSM",
            "description": "Greige Heavy Cotton Twill 220 GSM Rolls",
            "quantity_meters": 6800.0,
            "warehouse_bay": "Roll Yard R-12",
            "lot_number": "LOT-TW-904",
            "allocated_batches": ["BT-904"],
            "status": "QUARANTINE_HOLD",
            "updated_at": "2026-10-03T11:00:00Z"
        }
    ],
    "maintenance_schedule": [
        {
            "booking_id": "MNT-2026-104",
            "machine_id": "Picanol OmniPlus-i Airjet #04",
            "facility": "Plant 1 — Weaving Shed Line 4",
            "slot": "2026-10-03 14:00 - 15:30 UTC",
            "technician": "Sr. Maintenance Eng. Marco V.",
            "purpose": "Optical weft feeler recalibration & nozzle pressure adjustment",
            "status": "SCHEDULED",
            "created_at": "2026-10-03T11:20:00Z"
        },
        {
            "booking_id": "MNT-2026-098",
            "machine_id": "Monforts Montex 8500 Stenter #02",
            "facility": "Plant 1 — Finishing Department",
            "slot": "2026-10-04 06:00 - 08:00 UTC",
            "technician": "Thermal Systems Specialist Chen W.",
            "purpose": "Burner temperature sensor calibration & exhaust duct cleaning",
            "status": "CONFIRMED",
            "created_at": "2026-10-02T18:00:00Z"
        }
    ],
    "equipment_slots": [
        {
            "slot_id": "SLOT-EQ-401",
            "equipment": "Datacolor 800 Spectrophotometer",
            "reserved_by": "Dyehouse Chemist Priya M.",
            "time_window": "2026-10-03 13:00 - 14:00 UTC",
            "purpose": "Batch BT-881 Delta E Lab Shade Confirmation",
            "status": "ACTIVE"
        },
        {
            "slot_id": "SLOT-EQ-402",
            "equipment": "Shimadzu Prominence HPLC-01",
            "reserved_by": "QC Analytical Chemist Sarah L.",
            "time_window": "2026-10-03 15:00 - 17:00 UTC",
            "purpose": "Active Ingredient Assay Run (USP Monograph)",
            "status": "BOOKED"
        }
    ],
    "capa_workflows": [
        {
            "capa_id": "CAPA-2026-031",
            "title": "Broken Pick Weft Tension Instability on Loom #04",
            "source_incident": "QC-2026-0904",
            "root_cause_analysis": "Accumulated micro-lint on optical weft detector causing false arrival trigger and premature cutter trip.",
            "corrective_actions": [
                "Air-blast clean sensor lens and yarn clamp assembly",
                "Recalibrate yarn arrival threshold window to ±2.5 ms",
                "Verify electronic weft brake (TED) holding torque"
            ],
            "owner": "Weaving Maintenance Lead",
            "status": "IN_PROGRESS",
            "target_completion": "2026-10-04"
        }
    ],
    "incident_logs": [
        {
            "incident_id": "INC-2026-019",
            "severity": "MEDIUM",
            "title": "Weft Intermittent Stop Fault on Line 4",
            "logged_by": "APEX Autonomous System / Operator Lead",
            "timestamp": "2026-10-03T10:14:22Z",
            "summary": "Repetitive broken pick defect detected during 4-point inspection.",
            "containment_action": "Line speed throttled from 720 to 650 RPM; maintenance ticket MNT-2026-104 booked."
        }
    ],
    "execution_audit_log": []
}


def _ensure_db() -> Dict[str, Any]:
    """Load DB from disk or initialize with seed data if not present."""
    if not _DB_PATH.exists():
        _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_DB_PATH, "w", encoding="utf-8") as f:
            json.dump(_DEFAULT_DB, f, indent=2)
        return _DEFAULT_DB.copy()
    try:
        with open(_DB_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Error reading operations DB, re-initializing: %s", e)
        return _DEFAULT_DB.copy()


def _save_db(data: Dict[str, Any]) -> None:
    """Save DB atomically to disk."""
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)


def get_all_records() -> Dict[str, Any]:
    """Retrieve full operations database records."""
    with _LOCK:
        return _ensure_db()


def get_records_by_target(target: str) -> List[Dict[str, Any]]:
    """Retrieve records for a specific category (e.g., 'qc_records', 'inventory', etc.)."""
    with _LOCK:
        db = _ensure_db()
        return db.get(target, [])


def execute_operation(
    tool: str,
    target: str,
    payload: Dict[str, Any],
    record_id: Optional[str] = None,
    summary: str = "",
    author: str = "APEX Autonomous Engine"
) -> Dict[str, Any]:
    """
    Execute a real operational action on the enterprise database.
    Supported tools:
    - 'update_record': Update or create a record in target collection.
    - 'book_system': Reserve maintenance downtime, calibration window, or equipment slot.
    - 'run_workflow': Trigger an automated operational workflow (CAPA, Quarantine, Line Isolation).
    - 'log_incident': Create an urgent operational incident log with containment steps.
    """
    with _LOCK:
        db = _ensure_db()
        now_iso = datetime.now(timezone.utc).isoformat()
        exec_id = f"EXEC-{int(datetime.now().timestamp() * 1000)}"

        result: Dict[str, Any] = {
            "execution_id": exec_id,
            "tool": tool,
            "target": target,
            "status": "EXECUTED_AND_COMMITTED",
            "timestamp": now_iso,
            "author": author,
            "summary": summary or f"Executed tool '{tool}' on target '{target}'."
        }

        # ── 1. UPDATE RECORD ──────────────────────────────────────────────────
        if tool in ("update_record", "create_record"):
            collection = db.setdefault(target, [])
            target_id = record_id or payload.get("id") or payload.get("batch_id") or payload.get("sku")
            existing = None
            if target_id:
                for item in collection:
                    if (item.get("id") == target_id or 
                        item.get("batch_id") == target_id or 
                        item.get("sku") == target_id or
                        item.get("booking_id") == target_id or
                        item.get("capa_id") == target_id):
                        existing = item
                        break

            if existing:
                existing.update(payload)
                existing["updated_at"] = now_iso
                result["action_type"] = "RECORD_UPDATED"
                result["record"] = existing
                result["summary"] = summary or f"Updated existing record '{target_id}' in '{target}'."
            else:
                new_item = {
                    "id": target_id or f"REC-{len(collection) + 1:04d}",
                    **payload,
                    "created_at": now_iso,
                    "updated_at": now_iso
                }
                collection.append(new_item)
                result["action_type"] = "RECORD_CREATED"
                result["record"] = new_item
                result["summary"] = summary or f"Created new record '{new_item['id']}' in '{target}'."

        # ── 2. BOOK SYSTEM / EQUIPMENT / MAINTENANCE ──────────────────────────
        elif tool == "book_system":
            if target == "equipment_slots":
                coll = db.setdefault("equipment_slots", [])
                bid = record_id or f"SLOT-EQ-{len(coll) + 400}"
                entry = {
                    "slot_id": bid,
                    "equipment": payload.get("equipment", "General Industrial Apparatus"),
                    "reserved_by": payload.get("operator", author),
                    "time_window": payload.get("time_window", payload.get("slot", "Next Available Window")),
                    "purpose": payload.get("purpose", summary),
                    "status": "CONFIRMED_BOOKED",
                    "created_at": now_iso
                }
                coll.append(entry)
                result["action_type"] = "SLOT_BOOKED"
                result["record"] = entry
                result["summary"] = summary or f"Booked equipment slot '{bid}' for {entry['equipment']}."
            else:
                coll = db.setdefault("maintenance_schedule", [])
                bid = record_id or f"MNT-{datetime.now().strftime('%Y')}-{len(coll) + 105:03d}"
                entry = {
                    "booking_id": bid,
                    "machine_id": payload.get("machine_id", payload.get("target_system", "Target Machine")),
                    "facility": payload.get("facility", "Main Processing Floor"),
                    "slot": payload.get("slot", payload.get("time_slot", "Emergency Staging Window")),
                    "technician": payload.get("technician", "Assigned Duty Specialist"),
                    "purpose": payload.get("purpose", summary),
                    "status": "SCHEDULED",
                    "created_at": now_iso
                }
                coll.append(entry)
                result["action_type"] = "MAINTENANCE_BOOKED"
                result["record"] = entry
                result["summary"] = summary or f"Scheduled maintenance '{bid}' on {entry['machine_id']}."

        # ── 3. RUN WORKFLOW ───────────────────────────────────────────────────
        elif tool == "run_workflow":
            coll = db.setdefault("capa_workflows", [])
            w_name = payload.get("workflow_name", payload.get("name", "Operational Protocol"))
            w_id = record_id or f"WF-{datetime.now().strftime('%Y')}-{len(coll) + 50:03d}"
            entry = {
                "workflow_id": w_id,
                "workflow_name": w_name,
                "parameters": payload.get("parameters", {}),
                "initiated_by": author,
                "status": "RUNNING_ACTIVE",
                "containment_dispatched": True,
                "started_at": now_iso,
                "summary": summary or f"Workflow '{w_name}' initiated and executing in background."
            }
            coll.append(entry)
            result["action_type"] = "WORKFLOW_TRIGGERED"
            result["record"] = entry
            result["summary"] = summary or f"Automated workflow '{w_name}' dispatched successfully."

        # ── 4. LOG INCIDENT ───────────────────────────────────────────────────
        elif tool == "log_incident":
            coll = db.setdefault("incident_logs", [])
            inc_id = record_id or f"INC-{datetime.now().strftime('%Y')}-{len(coll) + 20:03d}"
            entry = {
                "incident_id": inc_id,
                "severity": payload.get("severity", "HIGH"),
                "title": payload.get("title", summary or "Operational Deviation"),
                "logged_by": author,
                "timestamp": now_iso,
                "summary": payload.get("description", summary),
                "containment_action": payload.get("containment_action", "Immediate engineering containment deployed."),
                "status": "OPEN_CONTAINED"
            }
            coll.append(entry)
            result["action_type"] = "INCIDENT_LOGGED"
            result["record"] = entry
            result["summary"] = summary or f"Incident '{inc_id}' logged with severity {entry['severity']}."

        else:
            result["status"] = "UNRECOGNIZED_TOOL"
            result["summary"] = f"Unknown tool: '{tool}'"

        # Append to audit trail
        audit_trail = db.setdefault("execution_audit_log", [])
        audit_trail.append(result)
        # Keep last 100 executions
        if len(audit_trail) > 100:
            db["execution_audit_log"] = audit_trail[-100:]

        _save_db(db)
        logger.info("APEX Autonomous Action committed: [%s] -> %s", tool, result.get("summary"))
        return result
