"""
Claude tool-use schema definitions.
These describe the functions to the Anthropic API so it can call them.
"""

TOOLS = [
    {
        "name": "get_batch",
        "description": "Fetch process, machine, dye-bath and order data for a batch by batch_id.",
        "input_schema": {
            "type": "object",
            "properties": {
                "batch_id": {"type": "string", "description": "The batch identifier, e.g. 'BTH-2024-001'"}
            },
            "required": ["batch_id"]
        }
    },
    {
        "name": "get_machine_status",
        "description": (
            "Fetch live sensor readings and maintenance data for a machine: "
            "vibration (mm/s), bearing temperature (°C), hours since last maintenance, "
            "open maintenance tickets, and safety hold flag."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "machine_id": {"type": "string", "description": "Machine identifier, e.g. 'LOOM-07'"}
            },
            "required": ["machine_id"]
        }
    },
    {
        "name": "get_buyer_spec",
        "description": (
            "Fetch buyer-specific quality limits: Delta E limit, GSM tolerance %, "
            "defect-point limit per 100 m, special rules, and buyer risk tier."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "buyer_id":    {"type": "string", "description": "Buyer identifier"},
                "fabric_type": {"type": "string", "description": "Fabric type, e.g. 'cotton', 'denim'"}
            },
            "required": ["buyer_id", "fabric_type"]
        }
    },
    {
        "name": "get_dye_optimum",
        "description": (
            "Fetch approved dye-parameter ranges for a fabric × dye class combination: "
            "temperature range, pH range, liquor ratio range, salt/dispersion agent info."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "fabric_type": {"type": "string", "description": "Fabric type"},
                "dye_class":   {"type": "string", "description": "Dye class, e.g. 'reactive', 'disperse', 'acid'"}
            },
            "required": ["fabric_type", "dye_class"]
        }
    },
    {
        "name": "classify_defect_image",
        "description": (
            "Run the plant's defect-classification vision model on a fabric image. "
            "Returns defect class, confidence score and bounding box. "
            "Only call when the user has provided an image."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "image_base64": {"type": "string", "description": "Base-64 encoded JPEG or PNG of the fabric defect"}
            },
            "required": ["image_base64"]
        }
    },
    {
        "name": "predict_rejection",
        "description": (
            "Predict the pre-inspection batch rejection probability. "
            "Returns a Low/Medium/High risk band, the top contributing factors, "
            "and the model version. Use only pre-inspection process data as inputs."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "batch_inputs": {
                    "type": "object",
                    "description": (
                        "Key process parameters: fabric_type, dye_class, dye_bath_temp_c, "
                        "ph, liquor_ratio, speed_rpm, vibration_mm_s, bearing_temp_c, "
                        "hours_since_maintenance, shift, unit, machine_id"
                    )
                }
            },
            "required": ["batch_inputs"]
        }
    },
    {
        "name": "get_similar_cases",
        "description": "Retrieve past quality cases matching the same defect class, machine, and fabric type.",
        "input_schema": {
            "type": "object",
            "properties": {
                "defect":  {"type": "string", "description": "Defect class from the plant taxonomy"},
                "machine": {"type": "string", "description": "Machine identifier"},
                "fabric":  {"type": "string", "description": "Fabric type"}
            },
            "required": ["defect", "machine", "fabric"]
        }
    },
    {
        "name": "log_case",
        "description": (
            "Write a structured case record to the plant quality log for audit purposes. "
            "Call this silently after every defect diagnosis or prediction."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "case_json": {
                    "type": "object",
                    "description": (
                        "Case record with fields: case_id, timestamp, user_role, batch_id, "
                        "unit, shift, machine_id, fabric_type, buyer_id, defect_class, "
                        "classification_source, suspected_causes, confidence, risk_band, "
                        "model_version, actions_recommended, escalated_to, data_gaps, prompt_version"
                    )
                }
            },
            "required": ["case_json"]
        }
    },
    {
        "name": "escalate",
        "description": (
            "Page or message the appropriate human role. "
            "Use urgency='critical' for safety events. "
            "Mandatory for: Low confidence, unclassified defects, high-risk batches, "
            "re-dye/downgrade/scrap recommendations, repeat defects (≥3 in window), "
            "or when buyer spec cannot be fetched."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "to_role":  {"type": "string", "description": "Target role: SUPERVISOR | MAINTENANCE | MANAGER | DYEHOUSE | INSPECTOR"},
                "urgency":  {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                "summary":  {"type": "string", "description": "Brief plain-language summary of the issue and action needed"}
            },
            "required": ["to_role", "urgency", "summary"]
        }
    },
    {
        "name": "stop_line_request",
        "description": (
            "Send a line-stop REQUEST to the supervisor for a specific machine. "
            "This does NOT physically stop any machine — it notifies a human supervisor. "
            "Use when safety or severe quality concerns warrant supervisor decision to stop."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "machine_id": {"type": "string", "description": "Machine identifier"},
                "reason":     {"type": "string", "description": "Plain-language reason for requesting the stop"}
            },
            "required": ["machine_id", "reason"]
        }
    }
]
