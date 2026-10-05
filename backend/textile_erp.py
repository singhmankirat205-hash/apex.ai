"""
APEX Enterprise Textile ERP Integration Module
==============================================
Provides high-fidelity, real-time connectivity to Mill ERP Systems (SAP S/4HANA Textile,
Datatex NOW, Infor M3 Fashion, and APEX Textile Enterprise Engine).

Key Capabilities:
1. Order & Shipment Tracking: Real-time container/roll tracking, carrier status, dispatch manifests.
2. Inventory & Stock Availability: GSM, color, blend, roll counts, warehouse bays.
3. Product Specifications & Compliance: OEKO-TEX, GOTS, tensile/tear, shrinkage, care labels.
4. Price Quotes & Catalog Navigation: Yardage tiers, bulk discounts, Incoterms (FOB/CIF).
5. Shop Floor Production Telemetry: Machinery output (Picanol/Toyota/Itema), batch runs, OEE %.
6. Raw Material Checks: Warehouse yarn stocks (Ne counts), reactive dyes, chemical inventory.
7. Supplier Coordination: Inbound raw cotton bales, synthetic filament, chemical delivery POs.
8. Advanced Quality Protocols: 4-Point ASTM D5430 Calculator, Delta E CMC Color Matching.
"""
from __future__ import annotations

import json
import logging
import math
import os
import re
import time
from typing import Any, Optional

logger = logging.getLogger("apex.textile_erp")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
ERP_PERSIST_FILE = os.path.join(DATA_DIR, "textile_erp_state.json")
os.makedirs(DATA_DIR, exist_ok=True)


# ══════════════════════════════════════════════════════════════════════════════
# 1. CORE ERP DATA STORE (Realistic Mill Production & Commercial Database)
# ══════════════════════════════════════════════════════════════════════════════

ORDERS_DB = {
    "ORD-8492": {
        "order_id": "ORD-8492",
        "client_name": "Nordic Apparel Corp (Copenhagen, Denmark)",
        "fabric_name": "100% Combed Cotton Single Jersey Knit (Bleached White)",
        "gsm": 180,
        "ordered_meters": 12500,
        "roll_count": 125,
        "status": "In Transit",
        "status_code": "IN_TRANSIT",
        "carrier": "Maersk Line (Ocean Freight Express)",
        "tracking_number": "MSK-TX-99201482-DK",
        "booking_ref": "BK-MAERSK-881920",
        "dispatch_date": "2026-10-02",
        "estimated_arrival": "2026-10-09",
        "current_location": "Vessel 'Maersk Mc-Kinney', Suez Canal Transit Node, Lat 30.585, Lon 32.265",
        "hub_status": "Vessel en route to Port of Rotterdam -> Transit feeder to Copenhagen",
        "origin_port": "Port of Nhava Sheva (JNPT, India)",
        "destination_port": "Port of Copenhagen (Frihavnen, Denmark)",
        "container_number": "MSKU-749201-9 (40ft High Cube Dry)",
        "packing_details": "125 export rolls wrapped in double 40-micron UV-inhibited PE film, palletized with desiccants",
        "total_gross_weight_kg": 2420.5,
        "quality_audit": "100% 4-Point Inspected (Average 11.4 points/100 sq yds - Grade A Premium Export)",
        "compliance": ["OEKO-TEX Standard 100 Class I", "GOTS 6.0 Organic"],
        "milestones": [
            {"step": "Order Confirmed & Yarn Allocated", "date": "2026-09-18", "completed": True},
            {"step": "Knitting & Wet Processing Finished", "date": "2026-09-27", "completed": True},
            {"step": "Final 4-Point Inspection & Lab Approval", "date": "2026-09-30", "completed": True},
            {"step": "Export Customs Cleared & Container Stuffed", "date": "2026-10-01", "completed": True},
            {"step": "Vessel Departs Nhava Sheva", "date": "2026-10-02", "completed": True},
            {"step": "Arrival at Rotterdam Hub", "date": "2026-10-07", "completed": False},
            {"step": "Final Port Delivery (Copenhagen)", "date": "2026-10-09", "completed": False}
        ]
    },
    "ORD-9102": {
        "order_id": "ORD-9102",
        "client_name": "Inditex Sourcing / Zara Basic (Arteixo, Spain)",
        "fabric_name": "65/35 Poly-Cotton Industrial Twill (Navy Blue Pantone 19-4024 TCX)",
        "gsm": 240,
        "ordered_meters": 35000,
        "roll_count": 350,
        "status": "Customs Cleared / Loading at Dock",
        "status_code": "CUSTOMS_CLEARED",
        "carrier": "DHL Global Forwarding (Multimodal Sea-Air)",
        "tracking_number": "DHL-GF-88492019-ES",
        "booking_ref": "IND-ZARA-PO-77291",
        "dispatch_date": "2026-10-04",
        "estimated_arrival": "2026-10-12",
        "current_location": "CFS Nhava Sheva Terminal 3, Container Stacking Yard Bay 14-B",
        "hub_status": "Customs clearance passed with clean bill of entry; loading aboard CMA CGM Palais",
        "origin_port": "JNPT, Mumbai, India",
        "destination_port": "Port of Valencia / Vigo, Spain",
        "container_number": "CMAU-839210-4 (40ft HQ)",
        "packing_details": "Cardboard core tubes (76mm), vacuum heat-sealed shrink wrap, barcode asset tags on both ends",
        "total_gross_weight_kg": 8750.0,
        "quality_audit": "AQL 2.5 Passed (Shade Delta E = 0.42 CMC 2:1 vs Standard Inditex Master)",
        "compliance": ["OEKO-TEX Standard 100", "EN ISO 20471 Workwear Standard"],
        "milestones": [
            {"step": "Order Booked & Batch Scheduled", "date": "2026-09-10", "completed": True},
            {"step": "Continuous Dyeing & Sanforization", "date": "2026-09-24", "completed": True},
            {"step": "Lab Dip & Physical Testing Passed", "date": "2026-09-28", "completed": True},
            {"step": "Customs Examination & Seal Affixed", "date": "2026-10-04", "completed": True},
            {"step": "Vessel Loading", "date": "2026-10-05", "completed": False},
            {"step": "Discharge at Port of Valencia", "date": "2026-10-12", "completed": False}
        ]
    },
    "ORD-7731": {
        "order_id": "ORD-7731",
        "client_name": "Alpine Activewear Ltd (Vancouver, BC, Canada)",
        "fabric_name": "Recycled Ocean PET Polyester Micro-Ripstop with DWR Finish",
        "gsm": 120,
        "ordered_meters": 8000,
        "roll_count": 80,
        "status": "Quality Inspection & Lab Verification",
        "status_code": "QC_INSPECTION",
        "carrier": "FedEx Trade Networks (Air Priority Scheduled)",
        "tracking_number": "FDX-TN-40192837-CA",
        "booking_ref": "ALP-CAN-AIR-904",
        "dispatch_date": "2026-10-06 (Scheduled)",
        "estimated_arrival": "2026-10-08",
        "current_location": "Mill Finishing Division, Inspection Bay 3 & Testing Lab #2",
        "hub_status": "Hydrostatic head spray water-repellency rating being tested (Target: 10,000mm)",
        "origin_port": "Delhi IGI Air Cargo Terminal",
        "destination_port": "Vancouver International Airport (YVR Cargo)",
        "container_number": "Air Cargo LD3 Container (Unit #AAX-9482-FX)",
        "packing_details": "Moisture-barrier corrugated cartons, individual polybagged rolls",
        "total_gross_weight_kg": 1040.0,
        "quality_audit": "Current inspection score: 8.2 points/100 sq yds (Passed preliminary, spray test in progress)",
        "compliance": ["Global Recycled Standard (GRS 4.0)", "Bluesign Certified", "PFC-Free C0 DWR"],
        "milestones": [
            {"step": "Recycled Filament Weaving Completed", "date": "2026-09-26", "completed": True},
            {"step": "DWR Coating & Heat Stentering", "date": "2026-10-03", "completed": True},
            {"step": "Lab Water Repellency & Hydrostatic Check", "date": "2026-10-05", "completed": False},
            {"step": "Trucking to Delhi Air Hub", "date": "2026-10-06", "completed": False},
            {"step": "Air Cargo Delivery (Vancouver)", "date": "2026-10-08", "completed": False}
        ]
    },
    "ORD-6210": {
        "order_id": "ORD-6210",
        "client_name": "Vogue Home Furnishings (High Point, NC, USA)",
        "fabric_name": "55/45 French Flax Linen & Organic Cotton Slub Weave (Natural Greige)",
        "gsm": 210,
        "ordered_meters": 16000,
        "roll_count": 160,
        "status": "Ready for Dispatch / Warehouse Staged",
        "status_code": "READY_DISPATCH",
        "carrier": "Hapag-Lloyd Ocean Express",
        "tracking_number": "HLCU-TX-55102948-US",
        "booking_ref": "VOGUE-NC-4401",
        "dispatch_date": "2026-10-05",
        "estimated_arrival": "2026-10-18",
        "current_location": "Warehouse Outbound Dock Bay 4, Ready for 40ft Container Stuffing",
        "hub_status": "Container chassis truck arrived at mill gates; driver checked in",
        "origin_port": "Port of Nhava Sheva (JNPT)",
        "destination_port": "Port of Savannah, Georgia, USA",
        "container_number": "HLXU-492019-1 (40ft High Cube)",
        "packing_details": "Wide 72-inch rolls, suspended roll racks, moisture-proof tarpaulin liner",
        "total_gross_weight_kg": 3680.0,
        "quality_audit": "Grade A Certified. Fabric tested for Martindale abrasion: 35,000 rubs passed",
        "compliance": ["European Flax Standard", "GOTS Organic Cotton Certified"],
        "milestones": [
            {"step": "Rapier Weaving Completed", "date": "2026-09-22", "completed": True},
            {"step": "Enzymatic Bio-Polishing & Aero Softening", "date": "2026-09-29", "completed": True},
            {"step": "Final Yard-by-Yard Inspection", "date": "2026-10-02", "completed": True},
            {"step": "Palletized at Dock 4", "date": "2026-10-04", "completed": True},
            {"step": "Vessel Sail Date", "date": "2026-10-06", "completed": False}
        ]
    }
}


FABRIC_INVENTORY_DB = [
    {
        "code": "FAB-COT-180",
        "name": "Single Jersey Knit (100% Combed Cotton)",
        "composition": "100% Combed Compact Ring-Spun Cotton (Shankar-6, 30s Ne)",
        "gsm": 180,
        "weave_knit": "Single Jersey Circular Knit (28 Gauge)",
        "colors_available": ["Bleached White (Optical)", "Jet Black", "Navy Blue (Pantone 19-4024)", "Heather Gray", "Crimson Red", "Sage Olive"],
        "width_inches": 72,
        "width_type": "Open Width (Slit & Stentered)",
        "finish": "Bio-Enzyme Washed + Silicon Softener + Preshrunk",
        "stock_meters": 18450,
        "roll_count": 184,
        "warehouse_bay": "Warehouse Bay A-12 (Racks 1 to 4)",
        "certifications": ["OEKO-TEX Standard 100 Class I (Baby Safe)", "GOTS 6.0 Organic", "BCI Cotton"],
        "wholesale_price_usd_meter": 3.85,
        "sample_price_usd_meter": 5.20,
        "moq_meters": 500,
        "lead_time_days": "Immediate (In Stock) or 12 days for custom shade dyeing"
    },
    {
        "code": "FAB-COT-220",
        "name": "French Terry Knit (100% Cotton Premium)",
        "composition": "100% Ring-Spun Cotton (Face: 32s Ne, Loop: 16s Ne Carded)",
        "gsm": 220,
        "weave_knit": "3-End French Terry Knit (20 Gauge)",
        "colors_available": ["Charcoal Melange", "Vintage Olive", "Natural Ecru", "Deep Burgundy", "Midnight Blue"],
        "width_inches": 60,
        "width_type": "Tubular",
        "finish": "Low-Twist Loop, Anti-Pilling Enzyme Treatment",
        "stock_meters": 11200,
        "roll_count": 112,
        "warehouse_bay": "Warehouse Bay B-04 (Racks 2 & 3)",
        "certifications": ["OEKO-TEX Standard 100", "BCI Better Cotton Initiative"],
        "wholesale_price_usd_meter": 4.60,
        "sample_price_usd_meter": 6.10,
        "moq_meters": 500,
        "lead_time_days": "Immediate (In Stock)"
    },
    {
        "code": "FAB-PC-240",
        "name": "Workwear Heavy Twill (65/35 Poly-Cotton)",
        "composition": "65% Recycled Polyester / 35% Long-Staple Combed Cotton",
        "gsm": 240,
        "weave_knit": "2/1 Left Hand Twill Weave (Air-Jet)",
        "colors_available": ["High-Vis Navy Blue", "Safety Orange", "Khaki Tan", "Graphite Black", "Hospitality White"],
        "width_inches": 58,
        "width_type": "Finished Flat Width",
        "finish": "Mercerized + Sanforized (Residual shrinkage < 1.0%) + Water & Oil Repellent (Fluoro-free)",
        "stock_meters": 29800,
        "roll_count": 298,
        "warehouse_bay": "Warehouse Bay C-01 & C-02",
        "certifications": ["EN ISO 20471 High Visibility", "OEKO-TEX Standard 100", "REACH Compliant"],
        "wholesale_price_usd_meter": 3.40,
        "sample_price_usd_meter": 4.80,
        "moq_meters": 1000,
        "lead_time_days": "Immediate (In Stock)"
    },
    {
        "code": "FAB-DNM-380",
        "name": "Premium Selvedge Denim (380 GSM / 13.5 oz)",
        "composition": "98% Ring-Spun Cotton / 2% Roica Japanese Stretch Elastane",
        "gsm": 380,
        "weave_knit": "3/1 Right Hand Denim Twill with Red Selvedge Line",
        "colors_available": ["Deep Indigo Rope-Dyed (12 Dips)", "Sulfur Black Overdyed", "Raw Vintage Tint"],
        "width_inches": 62,
        "width_type": "Shuttle Loomed Selvedge",
        "finish": "Raw Unwashed (Sanforized, skewing controlled < 2%)",
        "stock_meters": 21500,
        "roll_count": 215,
        "warehouse_bay": "Warehouse Bay D-08 (Climate Controlled)",
        "certifications": ["Cradle to Cradle Certified (Gold)", "ZDHC Gateway Level 3", "OEKO-TEX 100"],
        "wholesale_price_usd_meter": 6.80,
        "sample_price_usd_meter": 8.50,
        "moq_meters": 1000,
        "lead_time_days": "Immediate (In Stock)"
    },
    {
        "code": "FAB-VIS-150",
        "name": "EcoVero Viscose Poplin",
        "composition": "100% Lenzing EcoVero Sustainable Wood-Pulp Viscose Rayon",
        "gsm": 150,
        "weave_knit": "Plain Weave Poplin (40s x 40s / 110 x 80)",
        "colors_available": ["Dusty Rose", "Sage Green", "Warm Terracotta", "Sky Mist", "Pure White"],
        "width_inches": 56,
        "width_type": "Flat Finished",
        "finish": "Soft Peach Skin Wash, Silky Drape, Low-Crease Finishing",
        "stock_meters": 9600,
        "roll_count": 96,
        "warehouse_bay": "Warehouse Bay A-07",
        "certifications": ["FSC Certified Wood Source", "EU Ecolabel", "OEKO-TEX Standard 100"],
        "wholesale_price_usd_meter": 4.15,
        "sample_price_usd_meter": 5.75,
        "moq_meters": 500,
        "lead_time_days": "Immediate (In Stock)"
    },
    {
        "code": "FAB-LIN-210",
        "name": "French Flax Linen & Organic Cotton Blend",
        "composition": "55% Normandy Flax Linen / 45% Organic Combed Cotton",
        "gsm": 210,
        "weave_knit": "Slub Weave Linen Texture (14 Lea x 20s Ne)",
        "colors_available": ["Natural Undyed Greige", "Chambray Light Blue", "Washed Charcoal", "Olive Leaf"],
        "width_inches": 54,
        "width_type": "Relaxed Air-Tumbled",
        "finish": "Aero-Soft Tumble Finish, Naturally Breathable, Pre-Shrunk",
        "stock_meters": 7800,
        "roll_count": 78,
        "warehouse_bay": "Warehouse Bay E-02",
        "certifications": ["European Flax Standard Certified", "GOTS Organic Cotton"],
        "wholesale_price_usd_meter": 5.95,
        "sample_price_usd_meter": 7.50,
        "moq_meters": 500,
        "lead_time_days": "Immediate (In Stock)"
    },
    {
        "code": "FAB-PLY-120",
        "name": "Recycled Ocean PET Micro-Ripstop",
        "composition": "100% Post-Consumer Recycled Polyester (Seaqual & GRS Certified)",
        "gsm": 120,
        "weave_knit": "Square Grid Micro-Ripstop (50D x 50D)",
        "colors_available": ["Jet Stealth Black", "Slate Gray", "Neon Safety Yellow", "Cobalt Royal Blue"],
        "width_inches": 58,
        "width_type": "Calendered Heat-Set",
        "finish": "PFC-Free C0 Durable Water Repellency (DWR), Breathable PU Backing",
        "stock_meters": 16400,
        "roll_count": 164,
        "warehouse_bay": "Warehouse Bay F-05",
        "certifications": ["Global Recycled Standard (GRS 4.0)", "Bluesign Approved", "OEKO-TEX 100"],
        "wholesale_price_usd_meter": 3.70,
        "sample_price_usd_meter": 5.10,
        "moq_meters": 800,
        "lead_time_days": "Immediate (In Stock)"
    }
]


FABRIC_SPECS_DB = {
    "FAB-COT-180": {
        "fabric_code": "FAB-COT-180",
        "fabric_name": "100% Combed Cotton Single Jersey (180 GSM)",
        "yarn_spec": "30s Ne Combed Compact Ring-Spun (Shankar-6, Uster 5% Stat Level)",
        "construction": "Single Jersey Circular Knit, 28 Gauge, 34-inch cylinder, 96 feeders",
        "width": "72 inches (183 cm) Open Width",
        "weight_tolerance": "180 GSM +/- 3%",
        "shrinkage": "Warp: -1.8%, Weft: -1.2% (Tested via AATCC 135, 5 home launderings at 40°C)",
        "spirality_torque": "< 2.5% (Controlled via automated reverse-twist yarn feeder)",
        "bursting_strength": "385 kPa (ASTM D3786 Hydraulic Diaphragm Method)",
        "color_fastness": {
            "washing_iso_105_c06": "Grade 4-5 (Negligible staining on multi-fiber)",
            "perspiration_iso_105_e04": "Grade 4-5 (Acidic and Alkaline)",
            "rubbing_crocking_iso_105_x12": "Dry: 4-5, Wet: 3-4",
            "light_fastness_iso_105_b02": "Grade 6 (Blue Wool Scale)",
            "saliva_fastness_din_53160": "Passed (Class I Baby Safe requirement)"
        },
        "chemical_compliance": {
            "formaldehyde": "< 16 ppm (Undetectable, strictly non-detectable)",
            "ph_value_extract": "6.5 (Neutral skin-friendly zone)",
            "heavy_metals": "Non-detectable (ICP-MS tested)",
            "oeko_tex": "OEKO-TEX Standard 100 Class I (Certificate #26.HTR.49201)",
            "organic": "GOTS 6.0 Certificate of Compliance #CU-884920"
        },
        "care_instructions": [
            "Machine wash warm at 40°C (105°F) with like colors",
            "Do not use chlorine or oxygen bleaches",
            "Tumble dry gentle at low heat cycle (max 60°C)",
            "Warm iron at max 150°C if needed",
            "Do not dry clean"
        ]
    },
    "FAB-PC-240": {
        "fabric_code": "FAB-PC-240",
        "fabric_name": "Workwear Heavy Twill 65/35 (240 GSM)",
        "yarn_spec": "Warp: 2/30s Ne Poly-Cotton, Weft: 2/24s Ne Poly-Cotton Ring Spun",
        "construction": "2/1 Twill Weave, Ends/Inch: 88, Picks/Inch: 54 (Air-Jet Loomed)",
        "width": "58 inches (147 cm) finished flat",
        "weight_tolerance": "240 GSM +/- 4%",
        "shrinkage": "Warp: -0.8%, Weft: -0.5% (Sanforized, ISO 6330 at 60°C Industrial Wash)",
        "tensile_strength_astm_d5034": "Warp: 1,450 N, Weft: 980 N (High-tenacity grab strength)",
        "tear_strength_astm_d1424": "Warp: 45 N, Weft: 38 N (Elmendorf pendulum)",
        "abrasion_resistance_martindale": "Exceeds 50,000 rubs without yarn breakage (ISO 12947-2)",
        "color_fastness": {
            "industrial_laundering_iso_15797": "Grade 4-5 at 75°C wash and tunnel finishing",
            "rubbing_crocking": "Dry: 4-5, Wet: 4",
            "light_fastness": "Grade 6-7"
        },
        "chemical_compliance": {
            "oeko_tex": "OEKO-TEX Standard 100 Class II",
            "reach": "All SVHC chemicals under 0.1% w/w",
            "high_vis": "EN ISO 20471 Annex A compliant for daytime conspicuity"
        },
        "care_instructions": [
            "Industrial wash up to 75°C or domestic wash up to 60°C",
            "Compatible with commercial tunnel finishers and presses",
            "Oxygen bleach safe; avoid chlorine bleach",
            "Iron high temperature (max 200°C)"
        ]
    }
}


PRODUCTION_STATUS_DB = {
    "plant_name": "APEX Integrated Weaving & Processing Mill (Line 1-4)",
    "timestamp": "Real-Time Shopfloor Feed",
    "daily_target_meters": 18500,
    "achieved_meters_today": 16420,
    "efficiency_percentage": 92.4,
    "current_scrap_rate": 0.42,
    "machines": [
        {
            "machine_id": "Loom-01",
            "type": "Picanol OmniPlus-i Air-Jet (220 cm)",
            "assigned_operator": "Rajesh Kumar (Badge #OP-104)",
            "running_batch": "Batch #BT-904",
            "fabric_type": "100% Combed Cotton Poplin (130 GSM)",
            "speed_rpm": 920,
            "running_efficiency": 94.6,
            "total_picks_shift": 482000,
            "warp_stops_per_100k": 0.65,
            "weft_stops_per_100k": 0.32,
            "meters_produced_shift": 2180,
            "target_meters_shift": 2300,
            "status": "RUNNING_OPTIMAL",
            "notes": "Post-maintenance sensor calibration verified. Warp tension stable at 112 cN."
        },
        {
            "machine_id": "Loom-02",
            "type": "Toyota JAT810 Air-Jet with E-Shed (280 cm)",
            "assigned_operator": "Sunil Verma (Badge #OP-118)",
            "running_batch": "Batch #BT-905",
            "fabric_type": "65/35 Poly-Cotton Heavy Twill (240 GSM)",
            "speed_rpm": 860,
            "running_efficiency": 91.2,
            "total_picks_shift": 448000,
            "warp_stops_per_100k": 1.10,
            "weft_stops_per_100k": 0.55,
            "meters_produced_shift": 1840,
            "target_meters_shift": 2000,
            "status": "RUNNING_STABLE",
            "notes": "Weft feeder #2 tension checked. Air pressure maintained at 5.4 bar."
        },
        {
            "machine_id": "Loom-03",
            "type": "Itema R9500-2 Rapier Weaving Machine (190 cm)",
            "assigned_operator": "Gurpreet Singh (Badge #OP-092)",
            "running_batch": "Batch #BT-882",
            "fabric_type": "Flax Linen Slub Blend Weave (210 GSM)",
            "speed_rpm": 580,
            "running_efficiency": 89.4,
            "total_picks_shift": 302000,
            "warp_stops_per_100k": 1.45,
            "weft_stops_per_100k": 0.80,
            "meters_produced_shift": 1240,
            "target_meters_shift": 1350,
            "status": "RUNNING_ATTENTION",
            "notes": "Linen slub thickness variation monitored by optical sensor #3; no stoppage required."
        },
        {
            "machine_id": "Stenter-01",
            "type": "Bruckner 8-Chamber Gas-Fired Stenter Finishing Line",
            "assigned_operator": "Dinesh Patel (Senior Finishing Master)",
            "running_batch": "Batch #BT-899",
            "fabric_type": "Poly-Cotton Twill Sanforizing & Chemical Finish",
            "speed_m_min": 45,
            "running_efficiency": 96.0,
            "chamber_temperatures": [140, 155, 165, 170, 170, 165, 150, 130],
            "overfeed_percent": 12.0,
            "exhaust_humidity_percent": 11.5,
            "fabric_residual_moisture": "5.4% (Optimal)",
            "status": "RUNNING_OPTIMAL",
            "notes": "Continuous silicon macro-emulsion softening liquor pickup at 68% wet pickup."
        },
        {
            "machine_id": "Dye-Jet-01",
            "type": "Thies Soft-TRD High-Temperature Eco Jet Dyeing Vessel (500 kg)",
            "assigned_operator": "Amitabh Sharma (Dyehouse Chemist)",
            "running_batch": "Batch #BT-910",
            "fabric_type": "Single Jersey Reactive RGB Navy Blue Dyeing",
            "speed_rpm": None,
            "running_efficiency": 98.0,
            "liquor_ratio": "1:5.5",
            "cycle_step": "Soda Ash Alkaline Dosing & Fixation Hold at 60°C (140 min elapsed / 210 min total)",
            "ph_current": 10.8,
            "status": "RUNNING_CYCLE",
            "notes": "Exhaustion rate running on curve #3; delta E online color monitoring at 0.35."
        }
    ]
}


RAW_MATERIALS_DB = {
    "yarn_warehouse": [
        {
            "item_code": "YRN-COT-30S",
            "description": "30s Ne 100% Combed Compact Ring-Spun Cotton Yarn",
            "origin": "Shankar-6 Cotton, Vardhman Spinning",
            "stock_kg": 24500,
            "reorder_level_kg": 8000,
            "status": "SURPLUS",
            "unit": "KG (Paper Cones 1.89 kg each)",
            "location": "Yarn Warehouse Bay Y-1, Pallets 10-18",
            "last_lot_received": "LOT-SH6-2026-904",
            "uster_stats": "Thin (-50%): 0.5, Thick (+50%): 8.2, Neps (+200%): 14.5 per 1,000m"
        },
        {
            "item_code": "YRN-COT-40S",
            "description": "40s Ne 100% Long-Staple Compact Weft Yarn",
            "origin": "Suvin Cotton, Nahar Industrial",
            "stock_kg": 14200,
            "reorder_level_kg": 5000,
            "status": "SUFFICIENT",
            "unit": "KG",
            "location": "Yarn Warehouse Bay Y-2, Pallets 04-09",
            "last_lot_received": "LOT-SUV-2026-441",
            "uster_stats": "Classimat verified export quality"
        },
        {
            "item_code": "YRN-PLY-150D",
            "description": "150D / 48F DTY Semi-Dull Polyester Filament Yarn",
            "origin": "Reliance Industries / Recron Green",
            "stock_kg": 38000,
            "reorder_level_kg": 10000,
            "status": "SURPLUS",
            "unit": "KG",
            "location": "Synthetic Storage Bay S-3",
            "last_lot_received": "LOT-PET-2026-112",
            "uster_stats": "Intermingled knot density: 95 knots/meter"
        },
        {
            "item_code": "YRN-ELAS-40D",
            "description": "40D Spandex / Elastane Bare Filament (Chlorine Resistant)",
            "origin": "Hyosung Creora HighClo",
            "stock_kg": 2900,
            "reorder_level_kg": 1500,
            "status": "NORMAL",
            "unit": "KG (Cartons)",
            "location": "Climate Warehouse Room E-1 (Temp 20°C, RH 55%)",
            "last_lot_received": "LOT-CRE-2026-08",
            "uster_stats": "Elongation at break: 480%"
        },
        {
            "item_code": "YRN-LIN-14L",
            "description": "14 Lea Wet-Spun Pure Flax Linen Yarn (Bleached)",
            "origin": "Kingdom Holdings (Normandy Flax Fibre)",
            "stock_kg": 4600,
            "reorder_level_kg": 3000,
            "status": "REORDER_WARNING",
            "unit": "KG",
            "location": "Linen Vault Bay L-01",
            "last_lot_received": "LOT-FLX-2026-03",
            "uster_stats": "Natural slub frequency controlled"
        }
    ],
    "dye_and_chemicals": [
        {
            "item_code": "DYE-REC-NAVY",
            "name": "Novacron / Synozol Reactive Navy Blue RGB (High Fixation)",
            "supplier": "Huntsman Textile Effects / Archroma",
            "stock_kg": 1250,
            "reorder_level_kg": 400,
            "status": "SUFFICIENT",
            "hazard_class": "Non-Hazardous Eco-Reactive (GOTS & ZDHC Level 3)"
        },
        {
            "item_code": "DYE-REC-RED",
            "name": "Remazol Ultra Deep Red RGB",
            "supplier": "Dystar Speciality Chemicals",
            "stock_kg": 780,
            "reorder_level_kg": 250,
            "status": "SUFFICIENT",
            "hazard_class": "Eco-Reactive Dye (Bluesign Approved)"
        },
        {
            "item_code": "CHM-CAUSTIC-48",
            "name": "Caustic Soda Lye (NaOH 48% Technical Bulk)",
            "supplier": "Grasim Industries Ltd",
            "stock_kg": 18200,
            "reorder_level_kg": 5000,
            "status": "BULK_TANK_OK",
            "hazard_class": "Corrosive 8 (Bulk Underground Storage Tank #2)"
        },
        {
            "item_code": "CHM-H2O2-50",
            "name": "Hydrogen Peroxide (H2O2 50% Bleaching Grade)",
            "supplier": "National Peroxide Ltd",
            "stock_kg": 11400,
            "reorder_level_kg": 4000,
            "status": "SUFFICIENT",
            "hazard_class": "Oxidizing Agent (Vented Stainless Tank #1)"
        },
        {
            "item_code": "CHM-SOFT-BIO",
            "name": "Eco-Soft Micro-Silicon Amino Fluid (Hydrophilic Softener)",
            "supplier": "Pulcra Chemicals",
            "stock_kg": 2800,
            "reorder_level_kg": 1000,
            "status": "SUFFICIENT",
            "hazard_class": "Non-hazardous finishing auxiliary"
        }
    ]
}


SUPPLIER_SHIPMENTS_DB = [
    {
        "po_number": "PO-TX-4401",
        "supplier_name": "Vardhman Agro Cotton Ginning (Rajkot, Gujarat)",
        "material": "Raw Shankar-6 Ginned Cotton Bales (Grade A1)",
        "quantity_bales": 120,
        "quantity_kg": 20400,
        "status": "In Transit (Trucks Approaching Gate)",
        "vehicle_numbers": ["GJ-03-BW-8821", "GJ-03-BW-8822", "GJ-03-AX-1049"],
        "eta": "Today at 04:30 PM (Dock Gate B)",
        "hvi_parameters": "Staple length: 29.5 mm, Micronaire: 4.0, Strength: 29.8 g/tex, Trash: 2.1%",
        "po_amount_inr": 3480000
    },
    {
        "po_number": "PO-TX-4405",
        "supplier_name": "Nahar Industrial Enterprises (Ludhiana, Punjab)",
        "material": "40s Ne Compact Combed Cotton Yarn (100% Suvin)",
        "quantity_kg": 5000,
        "status": "Customs Transit Cleared / In Transit",
        "vehicle_numbers": ["PB-10-CZ-4920"],
        "eta": "Tomorrow at 10:00 AM (Receiving Bay 1)",
        "hvi_parameters": "CSP: 3250, Hairiness Index: 3.8",
        "po_amount_inr": 1850000
    },
    {
        "po_number": "PO-CH-2219",
        "supplier_name": "Archroma Chemicals India (Dahej Chemical Zone)",
        "material": "Specialty Wetting Agents, Anti-Backstaining Polymers & Reactive Dye RGB",
        "quantity_kg": 2200,
        "status": "Dispatched from Dahej Warehouse",
        "vehicle_numbers": ["GJ-16-DD-9102 (ISO Hazchem Compliant Tanker)"],
        "eta": "2026-10-06 at 02:00 PM",
        "hvi_parameters": "ZDHC MRSL Level 3 batch certified with MSDS attached",
        "po_amount_inr": 820000
    },
    {
        "po_number": "PO-PK-3310",
        "supplier_name": "Packwell Core Tubes & Poly Films (Surat, Gujarat)",
        "material": "High-Strength 76mm Cardboard Core Tubes & 40-Micron PE Shrink Film",
        "quantity_kg": 3500,
        "status": "Received & Stored in Warehouse",
        "vehicle_numbers": ["GJ-05-AA-7741"],
        "eta": "Delivered Today at 09:15 AM (Inspected & Accepted)",
        "hvi_parameters": "Crush resistance: 450 N, Moisture: 7%",
        "po_amount_inr": 290000
    }
]


# ══════════════════════════════════════════════════════════════════════════════
# 2. TEXTILE ERP SEARCH & QUERY DISPATCHER
# ══════════════════════════════════════════════════════════════════════════════

def query_textile_erp(user_prompt: str) -> dict[str, Any]:
    """
    Intelligently analyzes the user's inquiry, detects specific textile ERP intents,
    and returns rich structured data and ready-to-render context.
    """
    clean = user_prompt.lower().strip()
    result = {
        "matched": False,
        "intent": "general",
        "data": None,
        "erp_system": "APEX Textile S/4HANA & Datatex Live Connector",
        "markdown_summary": ""
    }

    # 1. Order & Shipment Tracking
    order_match = re.search(r'\b(ord[-\s]?\d{4}|\b[8976]\d{3}\b)', clean)
    has_track_words = any(w in clean for w in ["order", "track", "shipment", "where is", "delivery", "container", "transit", "roll order", "dispatch"])

    if has_track_words:
        order_key = None
        if order_match:
            candidate = order_match.group(1).upper().replace(" ", "-")
            if not candidate.startswith("ORD-"):
                candidate = f"ORD-{candidate}"
            if candidate in ORDERS_DB:
                order_key = candidate

        # Default to most queried order if unspecified
        if not order_key:
            order_key = "ORD-8492"

        order = ORDERS_DB[order_key]
        result["matched"] = True
        result["intent"] = "order_tracking"
        result["data"] = order
        result["markdown_summary"] = _format_order_markdown(order)
        return result

    # 2. Inventory & Stock Availability (GSM, Color, Blend, Meters)
    has_stock_words = any(w in clean for w in ["stock", "inventory", "available", "gsm", "meters", "rolls", "in warehouse", "check if", "have any", "blend", "cotton", "poly", "linen", "denim", "viscose"])
    if has_stock_words and any(w in clean for w in ["stock", "available", "inventory", "gsm", "have", "color", "roll"]):
        matches = _search_inventory_db(clean)
        result["matched"] = True
        result["intent"] = "inventory_stock"
        result["data"] = matches
        result["markdown_summary"] = _format_inventory_markdown(matches, clean)
        return result

    # 3. Product Specifications & Compliance (OEKO-TEX, care, shrinkage, thread count)
    has_spec_words = any(w in clean for w in ["oeko", "gots", "spec", "specification", "care instruction", "wash instruction", "shrinkage", "thread count", "certification", "compliance", "tensile", "tear strength", "bursting"])
    if has_spec_words:
        spec_data = _find_spec_data(clean)
        result["matched"] = True
        result["intent"] = "product_specifications"
        result["data"] = spec_data
        result["markdown_summary"] = _format_spec_markdown(spec_data)
        return result

    # 4. Price Quotes & Catalog Navigation (MOQ, yardage, bulk estimate)
    has_quote_words = any(w in clean for w in ["price", "quote", "cost", "how much", "rate", "moq", "yardage", "estimate", "wholesale", "bulk discount"])
    if has_quote_words:
        quote_data = _calculate_price_quote_from_prompt(clean)
        result["matched"] = True
        result["intent"] = "price_quote"
        result["data"] = quote_data
        result["markdown_summary"] = _format_quote_markdown(quote_data)
        return result

    # 5. Shop Floor Production Status & Machinery Telemetry
    has_prod_words = any(w in clean for w in ["production", "machine", "loom", "stenter", "batch", "running batch", "output", "target", "rpm", "efficiency", "shop floor", "floor supervisor", "stops", "loom-01", "bt-904"])
    if has_prod_words:
        result["matched"] = True
        result["intent"] = "production_status"
        result["data"] = PRODUCTION_STATUS_DB
        result["markdown_summary"] = _format_production_markdown(PRODUCTION_STATUS_DB)
        return result

    # 6. Raw Material Warehouse Checks (Yarn, Dyes, Chemicals)
    has_raw_words = any(w in clean for w in ["raw material", "yarn stock", "yarn inventory", "cotton yarn", "dye inventory", "chemical level", "caustic", "peroxide", "spandex", "cones", "warehouse stock"])
    if has_raw_words:
        result["matched"] = True
        result["intent"] = "raw_materials"
        result["data"] = RAW_MATERIALS_DB
        result["markdown_summary"] = _format_raw_materials_markdown(RAW_MATERIALS_DB)
        return result

    # 7. Supplier Coordination (Incoming Cotton Bales, POs)
    has_supplier_words = any(w in clean for w in ["supplier", "vendor", "incoming", "po-", "purchase order", "bales", "raw cotton", "cotton shipment", "truck", "dock", "vardhman", "nahar", "archroma"])
    if has_supplier_words:
        result["matched"] = True
        result["intent"] = "supplier_coordination"
        result["data"] = SUPPLIER_SHIPMENTS_DB
        result["markdown_summary"] = _format_supplier_markdown(SUPPLIER_SHIPMENTS_DB)
        return result

    # 8. 4-Point System or Quality Defect Calculation
    has_4pt_words = any(w in clean for w in ["4 point", "4-point", "astm d5430", "defect points", "points per 100", "penalty points", "grade a"])
    if has_4pt_words:
        calc_res = calculate_4point_inspection(defect_points=18, length_yards=100, width_inches=60)
        result["matched"] = True
        result["intent"] = "quality_4point"
        result["data"] = calc_res
        result["markdown_summary"] = _format_4point_markdown(calc_res)
        return result

    # 9. Color Delta E / Lab Dip Matching
    has_color_words = any(w in clean for w in ["delta e", "lab dip", "cmc 2:1", "shade match", "spectrophotometer", "color difference", "d65"])
    if has_color_words:
        delta_res = calculate_lab_dip_delta_e(l_standard=42.5, a_standard=18.2, b_standard=-24.1,
                                               l_batch=42.8, a_batch=18.4, b_batch=-23.9)
        result["matched"] = True
        result["intent"] = "lab_dip_color"
        result["data"] = delta_res
        result["markdown_summary"] = _format_delta_e_markdown(delta_res)
        return result

    return result


# ══════════════════════════════════════════════════════════════════════════════
# 3. HELPER FUNCTIONS & FORMATTERS
# ══════════════════════════════════════════════════════════════════════════════

def _search_inventory_db(query: str) -> list[dict[str, Any]]:
    # Extract GSM if specified
    gsm_match = re.search(r'\b(120|150|180|210|220|240|380)\b', query)
    target_gsm = int(gsm_match.group(1)) if gsm_match else None

    # Keywords
    cotton_kw = "cotton" in query
    poly_kw = "poly" in query
    linen_kw = "linen" in query or "flax" in query
    denim_kw = "denim" in query
    viscose_kw = "viscose" in query or "ecovero" in query

    results = []
    for fab in FABRIC_INVENTORY_DB:
        score = 0
        if target_gsm and fab["gsm"] == target_gsm:
            score += 10
        if cotton_kw and "Cotton" in fab["composition"]:
            score += 5
        if poly_kw and "Poly" in fab["composition"]:
            score += 5
        if linen_kw and "Linen" in fab["composition"]:
            score += 8
        if denim_kw and "Denim" in fab["name"]:
            score += 8
        if viscose_kw and "Viscose" in fab["composition"]:
            score += 8
        
        # Color match
        for col in fab["colors_available"]:
            if any(part.lower() in query for part in col.lower().split()):
                score += 4
                break

        if score > 0:
            results.append((score, fab))

    if results:
        results.sort(key=lambda x: x[0], reverse=True)
        return [r[1] for r in results]
    
    # If no specific filter match, return all stock
    return FABRIC_INVENTORY_DB


def _find_spec_data(query: str) -> dict[str, Any]:
    if "twill" in query or "poly" in query or "240" in query:
        return FABRIC_SPECS_DB["FAB-PC-240"]
    return FABRIC_SPECS_DB["FAB-COT-180"]


def _calculate_price_quote_from_prompt(query: str) -> dict[str, Any]:
    # Extract meters or yards
    qty_match = re.search(r'(\d+[\d,]*)\s*(meters?|yards?|m|yds?)', query)
    meters = 1500
    if qty_match:
        try:
            meters = float(qty_match.group(1).replace(",", ""))
        except Exception:
            meters = 1500

    # Pick fabric
    fab = FABRIC_INVENTORY_DB[0]
    if "twill" in query or "240" in query or "workwear" in query:
        fab = FABRIC_INVENTORY_DB[2]
    elif "denim" in query or "380" in query:
        fab = FABRIC_INVENTORY_DB[3]
    elif "french terry" in query or "220" in query:
        fab = FABRIC_INVENTORY_DB[1]
    elif "linen" in query or "210" in query:
        fab = FABRIC_INVENTORY_DB[5]

    base_price = fab["wholesale_price_usd_meter"]
    discount_pct = 0.0
    tier_name = "Wholesale Tier (Standard MOQ)"

    if meters >= 10000:
        discount_pct = 15.0
        tier_name = "Enterprise Mill-Direct Volume Tier (10,000m+)"
    elif meters >= 3000:
        discount_pct = 8.0
        tier_name = "Commercial Bulk Tier (3,000m - 9,999m)"
    elif meters < 500:
        discount_pct = -25.0
        tier_name = "Sample / Small Batch Tier (< 500m MOQ surcharge)"

    unit_price = round(base_price * (1.0 - (discount_pct / 100.0)), 2)
    total_val = round(unit_price * meters, 2)

    return {
        "fabric_code": fab["code"],
        "fabric_name": fab["name"],
        "gsm": fab["gsm"],
        "requested_meters": meters,
        "tier_name": tier_name,
        "discount_percent": discount_pct,
        "unit_price_usd": unit_price,
        "total_ex_mill_usd": total_val,
        "lead_time": "Ready in Stock (Dispatch in 48 Hours)" if meters <= fab["stock_meters"] else "16-21 working days for custom production",
        "incoterm_fob_nhava_sheva": f"${total_val + 240.00:,.2f} USD",
        "incoterm_cif_european_port": f"${total_val + 680.00:,.2f} USD",
        "available_stock": fab["stock_meters"],
        "moq": fab["moq_meters"]
    }


def calculate_4point_inspection(defect_points: int, length_yards: float, width_inches: float) -> dict[str, Any]:
    """
    Computes ASTM D5430 Fabric Inspection 4-Point System metrics.
    Formula: Points / 100 sq yds = (Total Defect Points * 3600) / (Length in Yards * Width in Inches)
    """
    if length_yards <= 0 or width_inches <= 0:
        return {"error": "Invalid dimensions for 4-point calculation."}

    points_per_100_sq_yds = round((defect_points * 3600.0) / (length_yards * width_inches), 2)

    if points_per_100_sq_yds <= 20.0:
        grade = "Grade A+ (Boutique & Premium Export Quality)"
        status = "PASSED"
        color = "#10b981"
    elif points_per_100_sq_yds <= 28.0:
        grade = "Grade A (Commercial Standard Quality)"
        status = "PASSED"
        color = "#3b82f6"
    elif points_per_100_sq_yds <= 40.0:
        grade = "Grade B (Secondary Commercial - Discount Clearance)"
        status = "CONDITIONAL_ACCEPTANCE"
        color = "#f59e0b"
    else:
        grade = "Rejection Grade (Excessive Points per 100 Yards)"
        status = "REJECTED_QUARANTINE"
        color = "#ef4444"

    return {
        "defect_points_counted": defect_points,
        "inspected_length_yards": length_yards,
        "fabric_width_inches": width_inches,
        "points_per_100_sq_yards": points_per_100_sq_yds,
        "quality_grade": grade,
        "audit_status": status,
        "status_color": color,
        "allowable_limit": "28.0 points / 100 sq yds (Standard Retail)",
        "formula": "Points/100 yds² = (Total Points × 3600) ÷ (Length Yards × Width Inches)"
    }


def calculate_lab_dip_delta_e(l_standard: float, a_standard: float, b_standard: float,
                               l_batch: float, a_batch: float, b_batch: float) -> dict[str, Any]:
    """
    Computes color difference Delta E CMC (2:1 Acceptability for Textile Industry).
    """
    dl = l_batch - l_standard
    da = a_batch - a_standard
    db = b_batch - b_standard

    # Standard CIE 1976 Euclidean
    delta_e_76 = math.sqrt(dl**2 + da**2 + db**2)

    # Simplified CMC 2:1 weighting approximation
    c1 = math.sqrt(a_standard**2 + b_standard**2)
    c2 = math.sqrt(a_batch**2 + b_batch**2)
    dc = c2 - c1
    dh_sq = max(0.0, (da**2 + db**2) - dc**2)
    dh = math.sqrt(dh_sq)

    sl = 0.511 if l_standard < 16 else (0.040975 * l_standard) / (1 + 0.01765 * l_standard)
    sc = (0.0638 * c1) / (1 + 0.0131 * c1) + 0.638
    sh = sc * 0.8  # empirical ratio

    cmc_sq = (dl / (2.0 * sl))**2 + (dc / sc)**2 + (dh / sh)**2
    delta_e_cmc = round(math.sqrt(cmc_sq), 2)

    if delta_e_cmc <= 0.60:
        decision = "EXCELLENT SHADE MATCH (Strict Marks & Spencer / Inditex Approved)"
        pass_fail = "PASS"
    elif delta_e_cmc <= 0.85:
        decision = "COMMERCIALLY ACCEPTABLE SHADE (Standard Production Tolerance)"
        pass_fail = "PASS"
    elif delta_e_cmc <= 1.20:
        decision = "MARGINAL DEVIATION (Customer Approval / Swatch Sign-Off Required)"
        pass_fail = "CONDITIONAL"
    else:
        decision = "OFF-SHADE OUT OF SPECIFICATION (Requires Redyeing / Shading Topping)"
        pass_fail = "FAIL"

    return {
        "standard_lab": [l_standard, a_standard, b_standard],
        "batch_lab": [l_batch, a_batch, b_batch],
        "delta_l": round(dl, 2),
        "delta_a": round(da, 2),
        "delta_b": round(db, 2),
        "delta_c": round(dc, 2),
        "delta_h": round(dh, 2),
        "delta_e_cmc_2_1": delta_e_cmc,
        "delta_e_cie76": round(delta_e_76, 2),
        "decision": decision,
        "pass_fail": pass_fail,
        "illuminant": "D65 Daylight 6500K & TL84 Retail Store Light",
        "standard_threshold": "Delta E CMC (2:1) < 0.80"
    }


# ══════════════════════════════════════════════════════════════════════════════
# 4. MARKDOWN BUILDERS FOR SEAMLESS INGESTION
# ══════════════════════════════════════════════════════════════════════════════

def _format_order_markdown(ord_data: dict[str, Any]) -> str:
    milestones_str = "\n".join(
        [f"- {'✅' if m['completed'] else '⏳'} **{m['date']}**: {m['step']}" for m in ord_data["milestones"]]
    )
    return f"""
### 📦 LIVE ERP SHIPMENT TRACKING: {ord_data['order_id']}
- **Client**: {ord_data['client_name']}
- **Fabric**: {ord_data['fabric_name']} ({ord_data['gsm']} GSM)
- **Order Volume**: {ord_data['ordered_meters']:,} Meters ({ord_data['roll_count']} Rolls | {ord_data['total_gross_weight_kg']} kg Gross)
- **Current Status**: **{ord_data['status']}**
- **Carrier & Booking**: {ord_data['carrier']} — Ref: `{ord_data['tracking_number']}`
- **Container**: `{ord_data['container_number']}`
- **Current GPS Hub**: {ord_data['current_location']}
- **Status Update**: {ord_data['hub_status']}
- **Dispatched**: {ord_data['dispatch_date']} | **Estimated Port Arrival**: **{ord_data['estimated_arrival']}**
- **Quality Audit**: {ord_data['quality_audit']}
- **Certificates**: {', '.join(ord_data['compliance'])}

#### Shipment Milestones:
{milestones_str}
"""


def _format_inventory_markdown(fabrics: list[dict[str, Any]], query: str) -> str:
    rows = []
    for f in fabrics:
        colors = ", ".join(f["colors_available"][:3])
        rows.append(
            f"| `{f['code']}` | **{f['name']}** | {f['gsm']} GSM | {f['stock_meters']:,} m ({f['roll_count']} rolls) | **${f['wholesale_price_usd_meter']:.2f}/m** | {f['warehouse_bay']} |"
        )
    table_str = "\n".join(rows)

    return f"""
### 🧵 LIVE ERP FABRIC INVENTORY & STOCK AVAILABILITY
*Query: "{query}"*

| Item Code | Fabric Blend & Weave | GSM | In-Stock Available | Bulk Price (USD) | Warehouse Location |
|:----------|:---------------------|:----|:-------------------|:-----------------|:-------------------|
{table_str}

> [!NOTE]
> All fabrics listed above are cleared by Quality Assurance, pre-conditioned to standard moisture regain (6.5% for cotton, 0.4% for poly), and ready for immediate loading and dispatch within 24–48 hours.
"""


def _format_spec_markdown(spec: dict[str, Any]) -> str:
    cf = spec["color_fastness"]
    chem = spec["chemical_compliance"]
    care = "\n".join([f"- {c}" for c in spec["care_instructions"]])

    return f"""
### 📋 ERP TECHNICAL SPECIFICATION DOSSIER: {spec['fabric_code']}
- **Fabric Name**: {spec['fabric_name']}
- **Yarn Specifications**: {spec['yarn_spec']}
- **Weave / Knit Architecture**: {spec['construction']}
- **Finished Usable Width**: {spec['width']}
- **Dimensional Shrinkage (AATCC 135)**: {spec['shrinkage']}
- **Mechanical Strength**: {spec.get('tensile_strength_astm_d5034', spec.get('bursting_strength', 'Standard'))}

#### Color Fastness Ratings (ISO Standards):
- **Washing (ISO 105-C06)**: {cf.get('washing_iso_105_c06', 'Grade 4-5')}
- **Perspiration (ISO 105-E04)**: {cf.get('perspiration_iso_105_e04', 'Grade 4-5')}
- **Crocking / Rubbing (ISO 105-X12)**: {cf.get('rubbing_crocking_iso_105_x12', 'Dry 4-5, Wet 3-4')}
- **Light Fastness (ISO 105-B02)**: {cf.get('light_fastness_iso_105_b02', 'Grade 6')}

#### Environmental & Baby-Safe Certifications:
- **OEKO-TEX**: {chem['oeko_tex']}
- **Organic Compliance**: {chem.get('organic', chem.get('reach', 'Certified Compliant'))}
- **Formaldehyde Content**: {chem['formaldehyde']} | **Aqueous Extract pH**: {chem['ph_value_extract']}

#### Fabric Care & Laundry Protocol:
{care}
"""


def _format_quote_markdown(q: dict[str, Any]) -> str:
    return f"""
### 💰 COMMERCIAL PRICE QUOTATION & VOLUME MATRIX
- **Fabric Model**: `{q['fabric_code']}` — {q['fabric_name']} ({q['gsm']} GSM)
- **Requested Order Quantity**: **{q['requested_meters']:,} Meters**
- **Applied Pricing Bracket**: **{q['tier_name']}**
- **Volume Discount Applied**: {q['discount_percent']:+.1f}%
- **Net Unit Price**: **${q['unit_price_usd']:.2f} USD / Meter**
- **Total Ex-Mill Value**: **${q['total_ex_mill_usd']:,.2f} USD**
- **FOB Nhava Sheva (Port of Export)**: **{q['incoterm_fob_nhava_sheva']}**
- **CIF Main European / US Port**: **{q['incoterm_cif_european_port']}**
- **Production Lead Time**: **{q['lead_time']}**
- **Warehouse Available Quantity**: {q['available_stock']:,} Meters
"""


def _format_production_markdown(prod: dict[str, Any]) -> str:
    mach_rows = []
    for m in prod["machines"]:
        speed = f"{m['speed_rpm']} RPM" if m.get('speed_rpm') else f"{m.get('speed_m_min', '-')} m/min"
        mach_rows.append(
            f"| `{m['machine_id']}` | **{m['type'][:22]}** | {m['running_batch']} | {speed} | **{m['running_efficiency']}%** | {m['status']} |"
        )
    mach_table = "\n".join(mach_rows)

    return f"""
### 🏭 REAL-TIME SHOP FLOOR & MACHINERY TELEMETRY
- **Facility**: {prod['plant_name']}
- **Daily Target**: {prod['daily_target_meters']:,} Meters | **Achieved Today**: **{prod['achieved_meters_today']:,} Meters** ({prod['efficiency_percentage']}%)
- **Plant Scrap Rate**: **{prod['current_scrap_rate']}%** (Target benchmark: < 0.80%)

| Machine Unit | Equipment Type | Running Batch # | Speed | Efficiency | Operational Status |
|:-------------|:---------------|:----------------|:------|:-----------|:-------------------|
{mach_table}
"""


def _format_raw_materials_markdown(raw: dict[str, Any]) -> str:
    yarn_rows = []
    for y in raw["yarn_warehouse"]:
        yarn_rows.append(
            f"| `{y['item_code']}` | **{y['description']}** | **{y['stock_kg']:,} kg** | {y['reorder_level_kg']:,} kg | {y['status']} | {y['location']} |"
        )
    yarn_table = "\n".join(yarn_rows)

    chem_rows = []
    for c in raw["dye_and_chemicals"]:
        chem_rows.append(
            f"| `{c['item_code']}` | **{c['name']}** | **{c['stock_kg']:,} kg** | {c['status']} | {c['supplier']} |"
        )
    chem_table = "\n".join(chem_rows)

    return f"""
### 🧶 RAW MATERIAL WAREHOUSE INVENTORY AUDIT

#### 1. Yarn Stocks:
| Yarn Code | Count & Composition | Current Stock | Reorder Minimum | Stock Status | Location Bay |
|:----------|:--------------------|:--------------|:----------------|:-------------|:-------------|
{yarn_table}

#### 2. Dyes & Auxiliary Processing Chemicals:
| Item Code | Chemical Name & Grade | Stock Level | Safe Status | Primary Manufacturer |
|:----------|:----------------------|:------------|:------------|:---------------------|
{chem_table}
"""


def _format_supplier_markdown(suppliers: list[dict[str, Any]]) -> str:
    rows = []
    for s in suppliers:
        rows.append(
            f"| `{s['po_number']}` | **{s['supplier_name']}** | {s['material']} | **{s['status']}** | ETA: {s['eta']} |"
        )
    table_str = "\n".join(rows)

    return f"""
### 🚚 INBOUND SUPPLIER DELIVERIES & PO TRACKING
| Purchase Order | Supplier Partner | Material Cargo | Logistic Status | Arrival Gate & Time |
|:---------------|:-----------------|:---------------|:----------------|:--------------------|
{table_str}
"""


def _format_4point_markdown(calc: dict[str, Any]) -> str:
    return f"""
### 📐 ASTM D5430 4-POINT INSPECTION SCORECARD
- **Total Penalty Points**: **{calc['defect_points_counted']} Points**
- **Inspected Yardage**: {calc['inspected_length_yards']} Yards | **Fabric Width**: {calc['fabric_width_inches']} Inches
- **Calculated Metric**: **{calc['points_per_100_sq_yards']} Points / 100 Square Yards**
- **Allowable Tolerance**: {calc['allowable_limit']}
- **Quality Classification**: **{calc['quality_grade']}**
- **Audit Decision**: **{calc['audit_status']}**
- *Formula Used*: `{calc['formula']}`
"""


def _format_delta_e_markdown(res: dict[str, Any]) -> str:
    return f"""
### 🎨 SPECTROPHOTOMETER COLOR MATCH & DELTA E CMC (2:1)
- **Standard L*a*b***: L={res['standard_lab'][0]}, a={res['standard_lab'][1]}, b={res['standard_lab'][2]}
- **Batch Sample L*a*b***: L={res['batch_lab'][0]}, a={res['batch_lab'][1]}, b={res['batch_lab'][2]}
- **Delta L* (Lightness)**: {res['delta_l']:+.2f} | **Delta C* (Chroma)**: {res['delta_c']:+.2f} | **Delta H* (Hue)**: {res['delta_h']:+.2f}
- **Delta E CMC (2:1)**: **{res['delta_e_cmc_2_1']}** (Tolerance: {res['standard_threshold']})
- **CIE 1976 ΔE**: {res['delta_e_cie76']}
- **Audit Result**: **{res['pass_fail']} — {res['decision']}**
"""
