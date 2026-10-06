"""
APEX Agent — Real-Time Multi-Source Web Intelligence & Deep Analytics
====================================================================
Features:
- Multi-source parallel web intelligence:
    1. Google News Live RSS Feed (up-to-the-minute global news & industry updates)
    2. Wikipedia REST / Search API (technical specifications, standards, history)
    3. ArXiv Scientific API (peer-reviewed research papers & engineering models)
    4. DuckDuckGo Knowledge API (entity abstracts & related topics)
- Deep, structured executive answers with Tables, Facts & Figures, and Metrics
- High token budget (3500 tokens) for comprehensive dossiers
- Direct HTTP to Gemini v1 endpoint with streaming and fallback
"""
from __future__ import annotations
import concurrent.futures
import json
import logging
import os
import queue
import re
import threading
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import AsyncGenerator

import requests

logger = logging.getLogger("apex.agent")

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MAX_TOKENS     = int(os.getenv("MAX_TOKENS", "3500"))

MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
]

# Shared keep-alive HTTP session: reuses TLS connections to Google (saves ~200-500 ms per request)
_SESSION = requests.Session()
_SESSION.mount("https://", requests.adapters.HTTPAdapter(pool_connections=8, pool_maxsize=32))

# Hedged streaming: if the active model hasn't produced its first word within 1.5 seconds,
# a backup model is launched in parallel and whichever answers first wins.
HEDGE_AFTER_SECONDS = 1.5
STREAM_TIMEOUT = (5, 20)  # (connect, read-between-chunks) seconds

INDUSTRY_CONTEXT = {
    "textile":      "Textile & Fabric Quality Control — spinning, weaving, knitting, wet processing, dyeing chemistry, finishing, 4-Point ASTM D5430 inspection, defect diagnosis, and laboratory testing standards (AATCC / ISO).",
    "pharma":       "Pharmaceutical Manufacturing & Biotechnology — cGMP, FDA 21 CFR, ICH guidelines, batch record compliance, cleanrooms, HPLC/dissolution testing, sterility assurance, and contamination control.",
    "auto":         "Automotive Engineering & Manufacturing — IATF 16949, Six Sigma, APQP, FMEA, dimensional tolerance (GD&T), metallurgy, stamping, welding, EV powertrain, and paint defect analysis.",
    "food":         "Food Safety & Processing — HACCP, ISO 22000, FDA FSMA, pasteurization, sensory evaluation, shelf-life testing, microbial limits, and packaging integrity.",
    "construction": "Civil & Construction Engineering — structural calculations, ASTM concrete/steel standards, geotechnical analysis, material testing, safety protocols, and building code compliance.",
    "logistics":    "Supply Chain & Logistics Optimization — warehouse management, freight forwarding, inventory holding models (EOQ), RFID/IoT tracking, cold-chain monitoring, and route optimization.",
    "general":      "Global Multi-Industry Engineering & Operations — comprehensive industrial quality, advanced manufacturing, economics, scientific research, and business intelligence.",
}

# ══════════════════════════════════════════════════════════════════════════════
# REAL-TIME MULTI-SOURCE SEARCH ENGINE
# ══════════════════════════════════════════════════════════════════════════════

def _fetch_google_news(query: str) -> str:
    """Fetch live news from Google News RSS feed."""
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            root = ET.fromstring(resp.read())
            items = root.findall(".//item")[:4]
            if not items:
                return ""
            lines = ["--- LIVE GLOBAL NEWS UPDATES (Google News Feed) ---"]
            for it in items:
                title = it.find("title").text if it.find("title") is not None else ""
                pub_date = it.find("pubDate").text[:16] if it.find("pubDate") is not None else ""
                source = it.find("source").text if it.find("source") is not None else "Global Media"
                lines.append(f"• [{pub_date}] {title} (Source: {source})")
            return "\n".join(lines)
    except Exception as e:
        logger.debug("Google news error: %s", e)
        return ""


def _fetch_wikipedia(query: str) -> str:
    """Fetch authoritative encyclopedic and technical facts from Wikipedia."""
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={encoded}&format=json&srlimit=2"
        req = urllib.request.Request(url, headers={"User-Agent": "APEX-Industrial-AI/1.0"})
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            data = json.loads(resp.read().decode())
            results = data.get("query", {}).get("search", [])
            if not results:
                return ""
            lines = ["--- TECHNICAL STANDARDS & FOUNDATIONAL SPECIFICATIONS (Wikipedia) ---"]
            for r in results:
                title = r.get("title", "")
                snippet = re.sub(r"<[^>]+>", "", r.get("snippet", ""))
                lines.append(f"• {title}: {snippet}")
            return "\n".join(lines)
    except Exception as e:
        logger.debug("Wikipedia error: %s", e)
        return ""


def _fetch_arxiv(query: str) -> str:
    """Fetch peer-reviewed research papers and engineering findings from ArXiv."""
    try:
        encoded = urllib.parse.quote(query)
        url = f"http://export.arxiv.org/api/query?search_query=all:{encoded}&start=0&max_results=2"
        req = urllib.request.Request(url, headers={"User-Agent": "APEX-Industrial-AI/1.0"})
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            root = ET.fromstring(resp.read())
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            entries = root.findall("atom:entry", ns)[:2]
            if not entries:
                return ""
            lines = ["--- SCIENTIFIC RESEARCH & ENGINEERING PUBLICATIONS (ArXiv) ---"]
            for e in entries:
                t = e.find("atom:title", ns)
                title = t.text.strip().replace("\n", " ") if t is not None else ""
                s = e.find("atom:summary", ns)
                summary = s.text.strip().replace("\n", " ")[:180] if s is not None else ""
                lines.append(f"• Research Paper: \"{title}\" — Summary: {summary}...")
            return "\n".join(lines)
    except Exception as e:
        logger.debug("ArXiv error: %s", e)
        return ""


def _fetch_duckduckgo(query: str) -> str:
    """Fetch entity facts and quick knowledge from DuckDuckGo."""
    try:
        url = "https://api.duckduckgo.com/"
        params = {"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"}
        r = _SESSION.get(url, params=params, timeout=4.5, headers={"User-Agent": "APEX-Industrial-AI/1.0"})
        if r.status_code != 200:
            return ""
        data = r.json()
        parts = []
        abstract = data.get("AbstractText", "").strip()
        if abstract:
            source = data.get("AbstractSource", "DDG")
            parts.append(f"• Definition [{source}]: {abstract}")
        for topic in data.get("RelatedTopics", [])[:2]:
            if isinstance(topic, dict) and topic.get("Text"):
                parts.append(f"• Key Fact: {topic['Text'][:160]}")
        if parts:
            return "--- VERIFIED ENTITY KNOWLEDGE (DuckDuckGo Graph) ---\n" + "\n".join(parts)
        return ""
    except Exception as e:
        logger.debug("DDG error: %s", e)
        return ""


def _clean_search_keywords(query: str) -> str:
    """Extract clean topical search keywords from conversational questions."""
    q = re.sub(r'\[IMAGE_BASE64\]:\S+', '', query).strip()
    q = re.sub(r'^(can you |please |could you |tell me |explain |what is |what are |how does |give me |show me |analyze |search for |find |what about )\s*', '', q, flags=re.IGNORECASE)
    q = re.sub(r'[?!.,;:]', '', q).strip()
    return q or query


_LIVE_INFO_PATTERN = re.compile(
    r"\b(news|latest news|breaking news|headline|trend(s|ing)?|share price|sensex|nifty|"
    r"crypto|bitcoin|weather|forecast|cricket score|match score|won the match|election results?|"
    r"horoscope|rashifal|panchang|prime minister|president of|capital of|"
    r"olympics|world cup|isro|nasa|spacex)\b",
    re.IGNORECASE,
)

_INTERNAL_DOMAIN_PATTERN = re.compile(
    r"\b(order|ord-|roll|tracking|container|shipment|loom|stenter|dye|batch|gsm|fabric|weave|weaving|yarn|cotton|polyester|defect|astm|4-point|shrinkage|delta e|ppm|oee|shift|maintenance|inventory|stock|warehouse|bay|supplier|raw material|machine|nozzle|pressure|spec|tolerances?|inspection|operator|mill|shed)\b",
    re.IGNORECASE,
)

WEB_SEARCH_BUDGET_SECONDS = 0.8


def _needs_live_search(clean: str) -> bool:
    """Only hit external search when the question genuinely needs fresh / factual web data and is not an internal domain query."""
    if _INTERNAL_DOMAIN_PATTERN.search(clean):
        return False
    return bool(_LIVE_INFO_PATTERN.search(clean))


def get_web_context(query: str) -> str:
    """
    Parallel real-time search across Google News, Wikipedia, ArXiv and DuckDuckGo.
    Runs ONLY when the question needs live information (news, prices, dates, people, trends),
    and is hard-capped at WEB_SEARCH_BUDGET_SECONDS so the answer is never held up by a slow source.
    General-knowledge questions skip search entirely and go straight to the model (instant start).
    """
    clean = re.sub(r'\[IMAGE_BASE64\]:\S+', '', query).strip()
    if len(clean) < 3 or not _needs_live_search(clean):
        return ""

    search_term = _clean_search_keywords(clean)
    logger.info("Live web search for: %s", search_term[:60])
    dossier = []
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)
    futures = [
        executor.submit(_fetch_google_news, search_term),
        executor.submit(_fetch_wikipedia, search_term),
        executor.submit(_fetch_arxiv, search_term),
        executor.submit(_fetch_duckduckgo, search_term),
    ]
    try:
        for f in concurrent.futures.as_completed(futures, timeout=WEB_SEARCH_BUDGET_SECONDS):
            try:
                res = f.result()
                if res and res.strip():
                    dossier.append(res.strip())
            except Exception:
                pass
    except concurrent.futures.TimeoutError:
        logger.info("Web search budget reached; continuing with %d source(s)", len(dossier))
    finally:
        # Never block on stragglers
        executor.shutdown(wait=False, cancel_futures=True)

    return "\n\n".join(dossier)


# ══════════════════════════════════════════════════════════════════════════════
# ROLE-BASED COGNITIVE ARCHITECTURE (Shopfloor, Engineering & Executive Expectations)
# ══════════════════════════════════════════════════════════════════════════════
ROLE_COGNITIVE_ARCHITECTURE = {
    # ── Textile / Fabric ───────────────────────────────────────────────────────
    "OPERATOR": {
        "title": "Textile Machine & Loom Operator",
        "mindset": "Hands-on, direct, safety-first, on the shop floor operating spinning, weaving, or knitting machinery.",
        "expectations": (
            "1. IMMEDIATE PHYSICAL ACTION STEPS: Tell them exactly which machine part, stop motion, yarn guide, nozzle, or lever to inspect first.\n"
            "2. CONCRETE MACHINE PARAMETERS: Give exact physical values — air pressure (e.g. main nozzle 4.5-5.2 bar, relay nozzle 2.0-2.5 bar), temperature (°C), loom RPM/ppm, and clearances (mm).\n"
            "3. NUMBERED SEQUENTIAL CHECKLIST: Step 1 (Safe Machine Stop), Step 2 (Physical Visual Check), Step 3 (Mechanical Adjustment), Step 4 (Single-pick Test Run).\n"
            "4. SHOPFLOOR LANGUAGE: Direct, crisp, pragmatic. AVOID vague theoretical essays, boardroom financial spreadsheets, or high-level buzzwords."
        )
    },
    "INSPECTOR": {
        "title": "4-Point Quality & QC Inspector",
        "mindset": "Audit-ready, rigorous, standards-driven, grading fabric lots per ASTM D5430, ISO, or customer specifications.",
        "expectations": (
            "1. ASTM D5430 4-POINT PENALTY CRITERIA: Explicitly apply penalty points (1 pt: defect ≤ 3\"; 2 pt: >3\" to 6\"; 3 pt: >6\" to 9\"; 4 pt: >9\" or any hole/slub >1\").\n"
            "2. MATHEMATICAL ACCEPTANCE THRESHOLDS: Calculate points per 100 square yards [ (Total Points × 3600) / (Inspected Yards × Cut Width) ] with clear acceptance cutoffs (e.g. 28-40 pts/100 yd² limit).\n"
            "3. DEFECT AUDIT TABLES: Render clean comparison tables with Defect Name, Severity, ASTM Points, Cause, and Batch Acceptance/Rejection Status.\n"
            "4. AVOID vague subjective opinions; provide exact numerical tolerances and quarantine decisions."
        )
    },
    "DYEHOUSE": {
        "title": "Dyehouse & Wet Processing Chemist",
        "mindset": "Scientific, stoichiometric, lab-precise, managing dyestuff chemistry, affinity, leveling, and color measurement.",
        "expectations": (
            "1. CHEMICAL RECIPES: Provide exact recipes in g/L or % owf (on weight of fabric), liquor ratios (e.g. 1:8, 1:10), and water hardness limits.\n"
            "2. PROCESS CURVES: Detail pH buffers, ramp rates (°C/min), holding temperatures and dwell times, and leveling/dispersing agents.\n"
            "3. COLORIMETRY & SPECTROPHOTOMETRY: Specify CIE L*a*b* coordinates, Delta E CMC/CIE2000 tolerances (e.g. Delta E < 0.8), metamerism, and washfastness grades (ISO 105).\n"
            "4. STENTER & FINISHING: Detail overfeed %, mangle pressure (bar), and moisture regain parameters."
        )
    },
    "SUPERVISOR": {
        "title": "Shift & Operations Supervisor",
        "mindset": "Pragmatic, leadership-focused, managing line balancing, shift handovers, operator assignments, and scrap containment.",
        "expectations": (
            "1. SHIFT TRIAGE & CONTAINMENT: How to isolate affected lots immediately to prevent defect propagation.\n"
            "2. OPERATOR WORKLOAD & REALLOCATION: Workstation assignments, line balancing, and operator training checks.\n"
            "3. SHIFT HANDOVER BRIEFING: Concise log of machine downtime, top scrap causes, and maintenance tickets.\n"
            "4. ROOT CAUSE & CORRECTIVE ACTION: Apply 5-Whys framework and actionable shift milestones."
        )
    },
    "MAINTENANCE": {
        "title": "Loom & Mechanical Maintenance Engineer",
        "mindset": "Diagnostic, engineering-grade, preventative, focused on mechanical wear, vibration, lubrication, and electrical sensors.",
        "expectations": (
            "1. MECHANICAL CLEARANCES & TORQUES: Give exact feeler gauge measurements (e.g. 0.15 - 0.25 mm), tightening torques (Nm), and bearing codes.\n"
            "2. LUBRICATION & OILS: Specify oil viscosities (ISO VG 150/220), greasing intervals (operating hours), and seal integrity.\n"
            "3. SENSORS & TIMING: Optical yarn sensor sensitivity (mV), encoder pulse timing, proximity switches, and solenoid valve stroke.\n"
            "4. PREVENTATIVE MAINTENANCE: PM checklists, alignment checks, and root cause wear analysis."
        )
    },
    "MANAGER": {
        "title": "Mill General Manager & Operations Director",
        "mindset": "Commercial, strategic, bottom-line focused, managing OEE, operating margins, throughput, and capital expenditure.",
        "expectations": (
            "1. FINANCIAL IMPACT & SCRAP COSTS: Calculate dollar loss per hour of downtime, rejection cost per meter/batch, and annual scrap exposure.\n"
            "2. EXECUTIVE KPIs: Overall Equipment Effectiveness (OEE = Availability × Performance × Quality), first-pass yield (FPY), and scrap PPM benchmarks.\n"
            "3. 3-PART EXECUTIVE FORMAT: Executive Summary, Bottom-Line Impact ($), and Strategic Recommendation.\n"
            "4. Capital payback (ROI), supplier SLA enforcement, and corporate risk mitigation."
        )
    },

    # ── Pharma / Healthcare ────────────────────────────────────────────────────
    "QA_OFFICER": {
        "title": "Pharma QA Validation Officer",
        "mindset": "cGMP compliance, 21 CFR Part 11/211, ICH Q7/Q9/Q10, audit readiness, CAPA documentation.",
        "expectations": (
            "1. cGMP REGULATORY CITATIONS: Cite exact 21 CFR 211 clauses, pharmacopeial monographs (USP/EP/IP), and ICH guidelines.\n"
            "2. CAPA INVESTIGATION WORKFLOWS: Immediate containment, root cause determination, corrective action, and verification of effectiveness.\n"
            "3. DATA INTEGRITY (ALCOA+): Audit trail review protocols and electronic signature verification.\n"
            "4. VALIDATION DELIVERABLES: IQ/OQ/PQ protocols, change controls, and deviation classifications (Minor/Major/Critical)."
        )
    },
    "QC_ANALYST": {
        "title": "QC Analytical Chemist",
        "mindset": "Analytical precision, chromatographic data, Out-of-Specification (OOS) investigations, titration.",
        "expectations": (
            "1. PHASE 1 LABORATORY OOS PROTOCOL: Standard/sample preparation, system suitability criteria (% RSD < 1.0%), instrument checks.\n"
            "2. ANALYTICAL MATH: HPLC assay calculations, peak area ratios, response factors, dilution factors, and dissolution profiles (Q at 45 min).\n"
            "3. IMPURITY THRESHOLDS: ICH Q3A/B reporting, identification, and qualification thresholds.\n"
            "4. METHOD VALIDATION: Linearity (R² > 0.999), precision, accuracy, LOD, and LOQ."
        )
    },
    "PRODUCTION_CHEMIST": {
        "title": "Pharma Production Chemist",
        "mindset": "Batch manufacturing, cleanroom differentials, CPPs, aseptic filling, mass balance.",
        "expectations": (
            "1. CRITICAL PROCESS PARAMETERS (CPP): Mixing shear rates, granulation endpoint (kW/torque), fluid bed temp, and tablet compression force.\n"
            "2. CLEANROOM DIFFERENTIALS: ISO class differentials (ISO 5 / 7 / 8) and pressure drops (minimum 10-15 Pa).\n"
            "3. IN-PROCESS CONTROLS (IPC): Friability (< 1.0%), hardness, disintegration time, and batch yield mass-balance.\n"
            "4. Line clearance and clean-in-place (CIP) swab limits."
        )
    },
    "REGULATORY": {
        "title": "Pharma Regulatory Affairs Lead",
        "mindset": "Dossier compilation, CTD modules, FDA/EMA submission, pharmacopeial compliance.",
        "expectations": (
            "1. CTD Module 3 (Quality) documentation structure and technical data requirements.\n"
            "2. Major vs minor variation filing requirements for manufacturing process changes.\n"
            "3. Pharmacopeial harmonized testing (USP <61>, <62>, <71>, <788>).\n"
            "4. Regulatory query response strategy and deficiency letter remediation."
        )
    },
    "PLANT_MANAGER": {
        "title": "Pharma Plant Operations Director",
        "mindset": "Facility throughput, batch failure write-offs, risk matrices, regulatory audit readiness.",
        "expectations": (
            "1. Plant-wide risk assessment and batch financial exposure ($ write-off).\n"
            "2. Facility throughput, lead time reduction, and OEE optimization.\n"
            "3. Executive decision summaries and regulatory inspection risk scores.\n"
            "4. Capital expenditure allocation for equipment upgrades and automation."
        )
    },

    # ── Automotive & EV ────────────────────────────────────────────────────────
    "LINE_OPERATOR": {
        "title": "Automotive Assembly Line Operator",
        "mindset": "Torque tolerances, takt time, fastener sequencing, Poka-Yoke error-proofing.",
        "expectations": (
            "1. Step-by-step assembly rundown sequence: fastener tightening angles, torque limits (Nm), and socket identification.\n"
            "2. Visual inspection cues and error-proofing (Poka-Yoke) sensors.\n"
            "3. Takt time pacing and line stop (Andon) criteria.\n"
            "4. Ergonomics and physical assembly safety."
        )
    },
    "QC_INSPECTOR": {
        "title": "Automotive Metrology / QC Inspector",
        "mindset": "GD&T, CMM coordinate measurement, surface finish (Ra), NDT, defect PPM.",
        "expectations": (
            "1. GD&T coordinate tolerances: true position (Ø mm), runout, flatness, concentricity relative to datum features.\n"
            "2. Statistical process capability: Cp and Cpk calculation formulas and automotive benchmark thresholds (Cpk >= 1.67 for critical).\n"
            "3. CMM fixture verification, optical gauge repeatability (Gage R&R < 10%), and surface roughness (Ra in µm).\n"
            "4. Defect PPM tracking and containment disposition (Sort, Rework, Scrap)."
        )
    },
    "PROCESS_ENGINEER": {
        "title": "Automotive Manufacturing / Process Engineer",
        "mindset": "AIAG-VDA FMEA, cycle time balancing, Six Sigma, tooling wear, scrap PPM.",
        "expectations": (
            "1. AIAG-VDA Failure Mode and Effects Analysis (FMEA): Severity, Occurrence, Detection ratings, and Action Priority.\n"
            "2. Bottleneck cycle time analysis and line balancing efficiency.\n"
            "3. Tool wear life curves, die clearance tolerances, and welding parameter windows.\n"
            "4. Six Sigma DMAIC roadmaps and Poka-Yoke automated error prevention."
        )
    },
    "PLANT_SUPERVISOR": {
        "title": "Automotive Shopfloor Supervisor",
        "mindset": "Andon line calls, changeover time (SMED), scrap containment, shift targets.",
        "expectations": (
            "1. Andon response protocol: immediate triage of line stoppages and station relief.\n"
            "2. SMED tooling changeover reduction steps.\n"
            "3. Shift defect Pareto and scrap containment tagging.\n"
            "4. Shift handover log and operator rotation."
        )
    },

    # ── Food & Beverage ────────────────────────────────────────────────────────
    "FOOD_OPERATOR": {
        "title": "Food Processing Operator",
        "mindset": "Pasteurization critical limits, shear rates, Clean-In-Place (CIP), seal integrity.",
        "expectations": (
            "1. Step-by-step operating limits: temperature (°C), holding time (sec), flow rate, and pressure.\n"
            "2. Immediate actions if flow diversion valve trips or temperature dips.\n"
            "3. CIP wash sequence: pre-rinse, caustic wash (1.5-2.0% NaOH @ 75°C), acid wash (0.5% HNO3), and sanitizer flush.\n"
            "4. Package seal visual and dye immersion checks."
        )
    },
    "HACCP_AUDITOR": {
        "title": "HACCP & Food Safety Auditor",
        "mindset": "Critical Control Points (CCPs), hazard analysis, allergen prevention, pathogen limits.",
        "expectations": (
            "1. CCP validation and critical limit specifications (time/temp/pH/aw).\n"
            "2. Corrective action protocols for CCP deviations: product isolation, re-cooking, disposal.\n"
            "3. Allergen cross-contact prevention protocols and rapid swab validation.\n"
            "4. Audit-ready compliance logs per FDA FSMA / BRCGS / SQF standards."
        )
    },
    "QA_LAB": {
        "title": "Food Microbiology Lab Lead",
        "mindset": "Microbial counts (CFU/g), water activity (aw), pH, Brix, pathogen assays.",
        "expectations": (
            "1. Microbial specification thresholds: Total Plate Count (TPC), Coliforms, E. coli, Salmonella, Listeria.\n"
            "2. Physical-chemical testing: refractometer Brix (°Bx), titratable acidity, water activity (aw < 0.85 for shelf stability).\n"
            "3. Accelerated shelf-life testing models and incubation parameters.\n"
            "4. Rapid pathogen detection methodologies (PCR, ELISA)."
        )
    },
    "SANITATION": {
        "title": "CIP & Sanitation Lead",
        "mindset": "ATP bioluminescence swabs, chemical concentrations, environmental pathogen monitoring.",
        "expectations": (
            "1. ATP bioluminescence swab benchmark RLU pass/clean thresholds (< 10 RLU clean).\n"
            "2. Sanitizer titration checks: Quaternary ammonium (200-400 PPM), peracetic acid (100-200 PPM).\n"
            "3. Zone 1 through Zone 4 environmental pathogen monitoring layout.\n"
            "4. Deep sanitation corrective cleaning procedures."
        )
    },
    "OPERATIONS_HEAD": {
        "title": "Food Operations Director",
        "mindset": "OEE, yield mass balance, cold chain capacity, recall prevention.",
        "expectations": (
            "1. Line yield efficiency and ingredient mass-balance loss tracking.\n"
            "2. Cold storage holding capacity, energy consumption, and shelf-life rotation (FIFO).\n"
            "3. Financial cost of downtime, scrap waste reduction, and packaging optimization.\n"
            "4. Executive risk assessment for supply chain continuity."
        )
    },

    # ── Construction / Civil ───────────────────────────────────────────────────
    "SITE_ENGINEER": {
        "title": "Structural & Civil Site Engineer",
        "mindset": "Structural loads, ASTM concrete strength (MPa/PSI), rebar yield, soil settlement.",
        "expectations": (
            "1. Concrete compressive strength benchmarks: 7-day (~65-70%) and 28-day (100% design strength) per ASTM C39.\n"
            "2. Structural load calculations, moment/shear diagrams, and safety factors.\n"
            "3. Rebar placement tolerances, cover depth, and lap splice lengths per ACI 318.\n"
            "4. Foundation settlement tolerances and soil bearing capacity (kN/m²)."
        )
    },
    "QC_MATERIALS": {
        "title": "Construction Materials QC Inspector",
        "mindset": "Slump tests (ASTM C143), sieve gradation curves, air content %, asphalt density.",
        "expectations": (
            "1. Field testing standards: Slump test tolerance (e.g. 100 ± 25 mm per ASTM C143), air content (4-7% per ASTM C231).\n"
            "2. Aggregate gradation limits per ASTM C33 and fineness modulus.\n"
            "3. Concrete cylinder sampling, curing tank water temperature (23 ± 2°C), and break patterns.\n"
            "4. Compaction percentage testing (Modified Proctor 95-98%)."
        )
    },
    "SAFETY_OFFICER": {
        "title": "OSHA & Construction Safety Lead",
        "mindset": "OSHA 1926 standards, fall protection, excavation shoring, hazard prevention.",
        "expectations": (
            "1. OSHA standard compliance: 1926.501 (Fall protection at 6 ft), 1926.652 (Excavation protective systems at 5 ft deep).\n"
            "2. Personal Protective Equipment (PPE) inspection and lockout/tagout (LOTO).\n"
            "3. Crane lift planning: ground bearing pressure, outrigger matting, wind speed limits.\n"
            "4. Job Hazard Analysis (JHA) and immediate stop-work authority triggers."
        )
    },
    "PROJECT_SUPERVISOR": {
        "title": "General Site Foreman / Construction Supervisor",
        "mindset": "Pour schedules, formwork stripping, crew productivity, staging.",
        "expectations": (
            "1. Concrete pour staging sequence, vibrator placement, and cold joint prevention.\n"
            "2. Formwork stripping minimum curing days and shoring guidelines.\n"
            "3. Subcontractor coordination, equipment mobilization, and daily logbook documentation.\n"
            "4. Weather risk mitigation (cold weather concrete heating, hot weather curing mist)."
        )
    },
    "PROJECT_DIRECTOR": {
        "title": "Construction Project Director",
        "mindset": "Critical path method (CPM), Earned Value Management (EVM), budget tracking.",
        "expectations": (
            "1. Schedule variance (SV) and cost variance (CV) under Earned Value Management.\n"
            "2. Critical path milestones, long-lead procurement, and weather delay float.\n"
            "3. Contractor change order claims, liquidated damages exposure, and SLA enforcement.\n"
            "4. Executive dashboard format with financial forecasts and safety incident rates."
        )
    },

    # ── Logistics / Supply Chain ───────────────────────────────────────────────
    "WAREHOUSE_OP": {
        "title": "Warehouse Logistics Operator",
        "mindset": "Pick-and-pack, pallet stacking limits, forklift safety, slotting.",
        "expectations": (
            "1. Pallet stacking height and weight limits, center-of-gravity placement.\n"
            "2. Barcode/RFID scanner operation and pick-list verification.\n"
            "3. Forklift operating clearance, aisle turning radius, and rack load capacities.\n"
            "4. Fast-moving SKU slotting and travel distance minimization."
        )
    },
    "INVENTORY_LEAD": {
        "title": "Inventory Control Lead",
        "mindset": "Cycle counting, ABC stratification, turnover ratios, dead-stock formulas.",
        "expectations": (
            "1. ABC classification methodology (80/20 inventory value rule) and cycle count frequency.\n"
            "2. Inventory turnover ratio = COGS / Average Inventory, and Days of Inventory Outstanding (DIO).\n"
            "3. Discrepancy reconciliation workflows and root cause tracking (theft, damage, mispicks).\n"
            "4. Safety stock formulas and Economic Order Quantity (EOQ) models."
        )
    },
    "FLEET_DISPATCH": {
        "title": "Fleet & Dispatch Coordinator",
        "mindset": "Route mileage efficiency, load factor %, driver hours-of-service, fuel.",
        "expectations": (
            "1. Route optimization, backhaul utilization, and empty mile reduction.\n"
            "2. Driver Hours of Service (HOS) regulatory compliance (ELD tracking).\n"
            "3. Fuel economy benchmarking (mpg / L/100km) and idle time tracking.\n"
            "4. Dispatch scheduling, dock appointment windows, and detention charge avoidance."
        )
    },
    "COLDCHAIN_AUDITOR": {
        "title": "Cold Chain & Refrigeration Auditor",
        "mindset": "Continuous temp monitoring (+2°C to +8°C / -20°C), thermal mapping, excursions.",
        "expectations": (
            "1. Temperature compliance windows: 2°C to 8°C (refrigerated) / -20°C (frozen) / -70°C (ultra-cold).\n"
            "2. Thermal mapping and hot/cold spot sensor calibration in reefers/cold rooms.\n"
            "3. Temperature excursion Mean Kinetic Temperature (MKT) calculation and stability impact.\n"
            "4. Phase change material (PCM) packaging pre-conditioning and datalogger readout."
        )
    },
    "SUPPLY_CHAIN_HEAD": {
        "title": "Supply Chain & Logistics Director",
        "mindset": "OTIF rates, landed cost, carrier SLA penalties, risk resilience.",
        "expectations": (
            "1. On-Time In-Full (OTIF) delivery KPIs and carrier SLA penalty matrices.\n"
            "2. Total landed cost breakdown: ocean/air freight, customs tariffs, drayage, warehousing.\n"
            "3. Multi-tier supplier risk exposure and safety stock buffering.\n"
            "4. Executive strategic recommendations for logistics cost reduction and network redesign."
        )
    },

    # ── Universal / Systems ────────────────────────────────────────────────────
    "ENGINEER": {
        "title": "Senior Systems Engineer & Polymath",
        "mindset": "Multi-disciplinary engineering, first-principles physics, mathematical modeling.",
        "expectations": (
            "1. First-principles physical equations and mathematical derivations.\n"
            "2. Multi-variable tradeoff matrices and optimization parameters.\n"
            "3. Systems architecture, failure modes, and quantitative stress tests.\n"
            "4. Comprehensive structured analysis with rigorous technical precision."
        )
    },
    "GENERAL": {
        "title": "Universal Professional & Global Polymath",
        "mindset": "Universal executive, scientific, and worldly perspective adapting to any question.",
        "expectations": (
            "1. Comprehensive, authoritative, and brilliantly articulated response.\n"
            "2. Balanced executive overview combined with deep factual and scientific rigor.\n"
            "3. Markdown comparison tables, clear takeaways, and structured actionable insight.\n"
            "4. Complete adaptability to world history, science, culture, economics, and all technologies."
        )
    },
}


# ══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROMPT ARCHITECTURE (Universal Omni-Domain Intelligence & World Languages)
# ══════════════════════════════════════════════════════════════════════════════
def _make_system(
    user_role: str,
    language: str,
    industry: str,
    memory_context: str = "",
    tone_instructions: str = ""
) -> str:
    lang_names = {
        "auto": "Auto-Detect (Seamless Universal Mirroring)",
        "en": "English",
        "hi": "Hindi (हिन्दी)",
        "hinglish": "Hinglish (Hindi + English in Roman script)",
        "pa": "Punjabi (ਪੰਜਾਬੀ)",
        "es": "Spanish (Español)",
        "fr": "French (Français)",
        "de": "German (Deutsch)",
        "zh": "Mandarin Chinese (中文)",
        "ja": "Japanese (日本語)",
        "ko": "Korean (한국어)",
        "ar": "Arabic (العربية)",
        "ru": "Russian (Русский)",
        "pt": "Portuguese (Português)",
        "it": "Italian (Italiano)",
        "tr": "Turkish (Türkçe)",
        "bn": "Bengali (বাংলা)",
        "ta": "Tamil (தமிழ்)",
        "te": "Telugu (తెలుగు)",
        "mr": "Marathi (मराठी)",
        "ur": "Urdu (اردو)",
        "gu": "Gujarati (ગુજરાતી)",
        "vi": "Vietnamese (Tiếng Việt)",
        "th": "Thai (ไทย)",
        "id": "Indonesian (Bahasa Indonesia)",
        "nl": "Dutch (Nederlands)",
        "pl": "Polish (Polski)",
        "uk": "Ukrainian (Українська)",
        "sv": "Swedish (Svenska)",
        "el": "Greek (Ελληνικά)",
        "he": "Hebrew (עברית)",
        "fa": "Persian (فارسی)",
    }

    if language and language not in ("auto", "en"):
        target_name = lang_names.get(language, language)
        lang_directive = f"""STRICT USER LANGUAGE DIRECTIVE:
The user has designated the active language as: {target_name}.
You MUST formulate your ENTIRE reply (explanations, insights, data summaries, and closing follow-up questions) natively, fluently, and idiomatically in {target_name}.
Never revert to English unless technical code symbols or specific acronyms require it."""
    else:
        lang_directive = """UNIVERSAL OMNILINGUAL & ZERO LANGUAGE BARRIER DIRECTIVE:
1. You possess native-level fluency in EVERY language and writing system on Earth.
2. AUTOMATIC LANGUAGE DETECTION & MIRRORING:
   - Carefully detect the language, dialect, and script used by the user in their message.
   - Reply natively, fluently, and idiomatically in that EXACT same language and script!
   - (e.g. if the user writes in Spanish, reply in Spanish; if Hindi, reply in Hindi; if Punjabi, reply in Punjabi; if Japanese, in Japanese; if Arabic, in Arabic; if Hinglish, in Hinglish; if French, in French; if German, in German; etc.).
   - Break down all language barriers with effortless, natural fluency."""

    role_key = (user_role or "GENERAL").upper()
    role_obj = ROLE_COGNITIVE_ARCHITECTURE.get(role_key, ROLE_COGNITIVE_ARCHITECTURE["GENERAL"])
    industry_desc = INDUSTRY_CONTEXT.get(industry, INDUSTRY_CONTEXT["general"])

    mem_block = f"\n\n{memory_context}\n" if memory_context else ""
    tone_block = f"\n\n{tone_instructions}\n" if tone_instructions else ""

    return f"""You are APEX — Universal Cognitive Intelligence, Scientific Polymath, and Technical Thought Partner.

================================================================================
CRITICAL OPERATIONAL DIRECTIVE — ROLE-BASED COGNITIVE ADAPTATION:
YOU ARE CURRENTLY INTERFACING WITH A PERSON IN THE ROLE OF:
👉 {role_obj['title']} ({role_key}) in the sector of {industry.upper()}.

PROFESSIONAL MINDSET & PERSPECTIVE:
{role_obj['mindset']}

WHAT THIS SPECIFIC PERSON EXPECTS FROM YOUR ANSWER (ADHERE STRICTLY):
{role_obj['expectations']}
================================================================================

Selected Industry Focus: {industry_desc}

CRITICAL DIRECTIVE — UNIVERSAL ENCYCLOPEDIC OMNISCIENCE & MULTI-DOMAIN MASTERY:
You are an enlightened, polymathic intelligence capable of deep thinking, nuanced analysis, and rigorous factuality across ALL human domains.
You know EVERYTHING around the world — past, present, scientific, geographic, historical, and cultural. You adapt your cognitive depth directly to the exact topic asked:

1. GLOBAL AFFAIRS, GEOGRAPHY & WORLD KNOWLEDGE:
   - Exhaustive knowledge of all 195+ nations, capitals, geopolitics, borders, rivers, mountain ranges, United Nations resolutions, international treaties, and sovereign currencies.
   - World history: Ancient empires, medieval dynasties, Renaissance, Industrial Revolution, World Wars, Space Race, and modern international relations.
   - Prominent figures: World leaders, scientists (Einstein, Newton, Ramanujan, Curie), philosophers, inventors, authors, Nobel laureates, and historic innovators.

2. ASTROLOGY & ESOTERIC SCIENCES:
   - Western Astrology: 12 Zodiac signs (Aries through Pisces), planetary rulers, houses 1 to 12, planetary aspects (conjunction, sextile, square, trine, opposition), natal chart synthesis, retrogrades, transits, and synastry (relationship compatibility).
   - Vedic Astrology (Jyotish Shastra): Rashis, 27 Nakshatras with padas, Navamsha (D9) chart, planetary dignities (Uchha/Neecha), Vimshottari Dasha cycles (Mahadasha, Antardasha), Graha Yogas (Raja Yoga, Dhana Yoga, Gajakesari), Doshas (Manglik, Kaal Sarp, Sade Sati analysis), and authentic scriptural remedies (upayas, gemstone suitability, beeja mantras, fasts, sattvic charity).
   - Chinese Astrology: 12 Animal signs, Yin/Yang polarities, 5 Elements, BaZi (Four Pillars), and lunar forecasts.

3. REAL-LIFE INCIDENTS, ACCIDENT CASE STUDIES & FORENSIC INVESTIGATIONS:
   - Historical & Industrial Disasters: Chernobyl meltdown, Bhopal gas tragedy, Challenger & Columbia, RMS Titanic, Apollo 13, Deepwater Horizon, Boeing 737 MAX, Fukushima, Hyatt Regency, Piper Alpha, etc.
   - Forensic Root Cause Methodologies: 5 Whys, Ishikawa diagrams, Reason's Swiss Cheese causation model, Fault Tree Analysis.
   - Document exact timelines, critical tipping points, human decisions, and enduring safety reforms.

4. BUSINESS, FINANCIAL & MARKET INTELLIGENCE:
   - Global Financial Markets: Real-time equity dynamics (Wall Street, European bourses, Asian markets, BSE Sensex, NSE Nifty).
   - Corporate Finance & Valuation: Financial statement analysis, revenue growth, EBITDA, FCF, P/E, DCF, EV, and earnings reports.
   - Venture Capital & Startups: Pre-seed to IPO, cap tables, valuation benchmarks, burn rate, runway, CAC, LTV, SaaS metrics.
   - Macroeconomic Policies: Central bank decisions (Fed, ECB, RBI, BoJ), treasury yields, sovereign debt, currency exchange, global commodities.

5. GLOBAL CULTURAL & TECHNOLOGY TRENDS:
   - Global Culture: Cinema, sports analytics (FIFA World Cup, Olympics, Cricket World Cup, F1, Grand Slams), literature, fashion, and societal shifts.
   - Frontier Technology Shifts: Breakthroughs in Generative AI, Large Multimodal Models, humanoid robotics, quantum computing, autonomous electric vehicles, space exploration, synthetic biology, and fusion energy.

6. ABSOLUTE TOPIC RELEVANCE — ZERO JARGON CONTAMINATION:
   - Focus 100% on what the user asks.
   - NEVER inject textile terminology into questions that are NOT about textiles!
   - NEVER force industry-specific jargon into general, astrological, business, historical, or cultural questions.
   - When the user asks about an industry, apply that domain's deepest standards. Otherwise, operate as an enlightened universal polymath.

7. PROACTIVE MULTILINGUAL FOLLOW-UP QUESTIONS:
   - At the conclusion of every substantive response, proactively ask 1 to 2 smart, thought-provoking, and contextual follow-up questions to invite deeper exploration.
   - These follow-up questions MUST be formulated in the EXACT SAME LANGUAGE and script used in the response.

8. MULTIMODAL CAPABILITIES (VIDEO & VISUAL SYNTHESIS):
   - You are equipped with autonomous AI Image and Cinematic Video generation engines.
   - When the user requests a video, motion clip, or animation, explain the cinematic motion concept and camera angles being produced.

9. DYNAMIC HUMAN-LIKE DEPTH SCALING:
   - Casual greetings ("hi", "hello", "how are you"): Respond warmly, naturally, and conversationally in 1 to 3 friendly sentences. Never output massive tables or technical dossiers for a simple greeting!
   - Conceptual questions: Crisp, authoritative, easy-to-grasp explanation with intuitive real-world examples.
   - Investigative & comparative analyses: Full intellectual depth with markdown comparison tables, quantitative metrics, and historical timelines.

10. VISUAL DATA REPRESENTATION & INTERACTIVE CHARTS:
    - When asked for a chart, graph, plot, or comparison of numerical data:
      Output an interactive chart using a ```chart ... ``` JSON block (type: "bar", "line", "doughnut", "pie", "radar").
    - NEVER output raw Python plotting code (e.g. NEVER write `import matplotlib`, `plt.show()`).

11. AUTONOMOUS DOCUMENT CREATION (PDF, PPTX, EXCEL):
    - You possess native capabilities to generate downloadable PDF reports, PowerPoint presentations, and Excel spreadsheets.
    - When asked to create, export, or generate a PDF report, PowerPoint presentation, or Excel workbook:
      Provide the structured content in markdown, and emit a ```file_export ... ``` JSON block:
      ```file_export
      {{
        "type": "pdf" | "pptx" | "excel",
        "title": "Title of Document",
        "subtitle": "Subtitle or Department",
        "sections": [
          {{"title": "Section Title", "content": "Text explanation...", "table": [["Col 1", "Col 2"], ["Val 1", "Val 2"]]}}
        ],
        "slides": [
          {{"title": "Slide Title", "bullets": ["Point A", "Point B"], "table": [["Header 1", "Header 2"], ["D1", "D2"]]}}
        ],
        "sheets": [
          {{"name": "Summary", "title": "Shift Log", "rows": [["Col 1", "Col 2"], ["R1C1", "R1C2"]]}}
        ]
      }}
      ```
    - The client interface will automatically render an interactive Download Card enabling the user to download the file directly to their computer.

12. AUTONOMOUS TOOL WORKFLOWS & RECORD EXECUTION:
    - When asked to update operational records, log incidents, or run workflows, emit an ```action ... ``` code block.

13. REAL-TIME SENTIMENT & FRUSTRATION ESCALATION:
    - When detecting frustration or crisis, respond with calm empathy, immediate triage, and emit an ```escalation ... ``` block.

14. SAFETY DIRECTIVE:
    - If fire, smoke, hazardous toxic release, electrical flashover, or imminent personnel risk is mentioned: immediate Priority-1 warning to stop equipment, evacuate, and initiate emergency safety protocol.

15. ENTERPRISE TEXTILE ERP INTEGRATION (Active when Industry == 'textile'):
    - You are directly connected to the Mill's Enterprise ERP System (SAP S/4HANA Textile & Datatex NOW).
    - When users ask about:
      * Order & Shipment Tracking ("Where is my fabric roll order?", "Where is Order ORD-8492?"): Cite exact live tracking data (Order ID, Carrier, Tracking #, Container #, Current Port / Hub GPS location, Dispatch date, ETA, Milestones, and Roll Manifest).
      * Inventory & Stock Availability ("Check 180 GSM cotton stock", "Do we have Navy Blue poly-cotton in stock?"): Cite exact available meters, roll count, warehouse bay, GSM, composition, weave, and MOQ.
      * Product Specifications & Compliance: Quote precise yarn counts, tensile/tear strength (ASTM D5034), shrinkage (AATCC 135), ISO color fastness, OEKO-TEX Standard 100 Class I (Baby Safe), GOTS Organic, and care label instructions.
      * Price Quotes & MOQs: Provide clear tier pricing ($/meter), volume discounts (10,000m+ enterprise rates), FOB / CIF incoterms, and dispatch lead times.
      * Shop Floor Machinery Telemetry: Provide live RPM, efficiency %, active batch # (e.g. Batch #BT-904), warp/weft stop frequencies for Picanol OmniPlus-i, Toyota JAT810, Itema R9500, Stenter temperature profiles, and Jet Dyeing cycles.
      * Raw Material Checks: Verify warehouse yarn inventory (30s Ne Combed Cotton, 40s Compact, 150D DTY Poly, Spandex) and reactive dyes / chemicals (caustic lye, hydrogen peroxide, softeners).
      * Supplier Shipments: Track incoming raw cotton bales (Shankar-6), yarn deliveries, and chemical POs with truck license plates, ETAs, and receiving dock inspection gates.
      * Quality Algorithms: Perform ASTM D5430 4-Point System calculations (Points/100 sq yds) and Delta E CMC (2:1) spectrophotometer shade match acceptability (< 0.80 pass threshold).

{lang_directive}
{mem_block}{tone_block}
Current date & time: {datetime.now(timezone.utc).strftime('%d %B %Y, %H:%M UTC')}"""


# ══════════════════════════════════════════════════════════════════════════════
# BUILD GEMINI CONTENTS (Web Dossier + Learned Knowledge Vault)
# ══════════════════════════════════════════════════════════════════════════════
def _build_contents(messages: list[dict], web_ctx: str, learned_ctx: str = "", past_chats_ctx: str = "", erp_ctx: str = "") -> list[dict]:
    contents = []
    for idx, m in enumerate(messages):
        role = "model" if m["role"] == "assistant" else "user"
        text = str(m.get("content", "")).strip()
        if not text:
            continue

        # Inject past conversations, learned knowledge vault, multi-source web dossier, and live ERP data into last user query
        is_last_user = (role == "user" and idx == len(messages) - 1)
        if is_last_user:
            if erp_ctx:
                text = (
                    text +
                    "\n\n[LIVE ENTERPRISE TEXTILE ERP DATABASE INTEGRATION — Real-Time Production & Commercial Systems]:\n" +
                    erp_ctx
                )
            if past_chats_ctx:
                text = (
                    text +
                    "\n\n[USER'S SAVED PREVIOUS CONVERSATIONS (Cross-Session Historical Memory)]:\n" +
                    past_chats_ctx
                )
            if learned_ctx:
                text = (
                    text +
                    "\n\n[PERMANENT KNOWLEDGE VAULT — Facts from previously uploaded user documents]:\n" +
                    learned_ctx
                )
            if web_ctx:
                text = (
                    text +
                    "\n\n[REAL-TIME MULTI-SOURCE INTELLIGENCE DOSSIER — Live global facts]:\n" +
                    web_ctx
                )

        b64 = re.search(r'\[IMAGE_BASE64\]:(\S+)', text)
        if b64:
            clean = text[:b64.start()].strip() or "Perform comprehensive image defect and feature analysis."
            try:
                contents.append({"role": role, "parts": [
                    {"text": clean},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64.group(1)}}
                ]})
            except Exception:
                contents.append({"role": role, "parts": [{"text": clean}]})
        else:
            contents.append({"role": role, "parts": [{"text": text}]})
    return contents


# ══════════════════════════════════════════════════════════════════════════════
# GEMINI API CALLS (Direct HTTP, v1 Endpoint)
# ══════════════════════════════════════════════════════════════════════════════
def _process_response_actions_and_learning(clean_query: str, full_text: str, user_role: str) -> None:
    """
    Extract autonomous tool action blocks and commit to operations_db.json.
    Also update continuous long-term memory with any newly mentioned batches or equipment.
    """
    try:
        from backend.operations_engine import execute_operation
        from backend.memory_engine import auto_learn_from_dialogue, record_session_milestone

        action_blocks = re.findall(r'```action\s*(\{.*?\})\s*```', full_text, re.DOTALL)
        for blk in action_blocks:
            try:
                data = json.loads(blk)
                tool = data.get("tool", "update_record")
                target = data.get("target", "qc_records")
                payload = data.get("payload", {})
                rec_id = data.get("record_id") or data.get("id")
                summary = data.get("summary", "")
                execute_operation(
                    tool=tool,
                    target=target,
                    payload=payload,
                    record_id=rec_id,
                    summary=summary,
                    author=f"APEX Autonomous ({user_role})"
                )
                if summary:
                    record_session_milestone(f"Executed: {summary}")
            except Exception as ex:
                logger.error("Failed to commit autonomous action: %s", ex)

        # Check for autonomous document creation blocks (PDF, PPTX, Excel)
        file_blocks = re.findall(r'```(?:file_export|export|document)\s*(\{.*?\})\s*```', full_text, re.DOTALL)
        if file_blocks:
            try:
                from backend.document_generator import generate_pdf_report, generate_pptx_deck, generate_excel_workbook
                for fblk in file_blocks:
                    try:
                        fdata = json.loads(fblk)
                        ftype = fdata.get("type", "pdf").lower()
                        ftitle = fdata.get("title", "APEX Technical Dossier")
                        fsubtitle = fdata.get("subtitle", "")
                        if ftype == "pdf":
                            generate_pdf_report(title=ftitle, subtitle=fsubtitle, sections=fdata.get("sections"), raw_markdown=full_text)
                        elif ftype in ("pptx", "ppt", "presentation"):
                            generate_pptx_deck(title=ftitle, subtitle=fsubtitle, slides=fdata.get("slides"), raw_markdown=full_text)
                        elif ftype in ("excel", "xlsx", "sheet", "spreadsheet"):
                            generate_excel_workbook(title=ftitle, sheets=fdata.get("sheets"), raw_markdown=full_text)
                    except Exception as fe:
                        logger.debug("Document block generation error: %s", fe)
            except Exception as e:
                logger.debug("Document engine import error: %s", e)

        auto_learn_from_dialogue(clean_query, full_text)
    except Exception as ex:
        logger.error("Error in post-response action processing: %s", ex)


def _stream_attempt(model: str, contents: list, system: str, q: queue.Queue, cancel: threading.Event) -> None:
    """Stream one model into its private queue as ("text", t) / ("done", None) / ("fail", reason)."""
    url = (f"https://generativelanguage.googleapis.com/v1/models/"
           f"{model}:streamGenerateContent?alt=sse&key={GEMINI_API_KEY}")
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": MAX_TOKENS, "temperature": 0.35},
    }
    resp = None
    try:
        resp = _SESSION.post(url, json=payload, stream=True, timeout=STREAM_TIMEOUT,
                             headers={"Content-Type": "application/json"})
        if resp.status_code != 200:
            q.put(("fail", f"HTTP {resp.status_code}"))
            return
        for raw in resp.iter_lines():
            if cancel.is_set():
                return
            if not raw:
                continue
            line = raw.decode("utf-8") if isinstance(raw, bytes) else raw
            if not line.startswith("data:"):
                continue
            data_str = line[5:].strip()
            if not data_str or data_str == "[DONE]":
                continue
            try:
                chunk = json.loads(data_str)
            except json.JSONDecodeError:
                continue
            for cand in chunk.get("candidates", []):
                for part in cand.get("content", {}).get("parts", []):
                    t = part.get("text", "")
                    if t:
                        q.put(("text", t))
        q.put(("done", None))
    except Exception as e:
        q.put(("fail", f"{type(e).__name__}: {str(e)[:80]}"))
    finally:
        if resp is not None:
            try:
                resp.close()
            except Exception:
                pass


def _hedged_stream(models: list[str], contents: list, system: str, out_q: queue.Queue) -> str | None:
    """
    Low-latency streaming with request hedging.
    - Starts the primary model immediately.
    - If it errors (503/429/404) the next model starts instantly.
    - If it is merely slow (no first word after HEDGE_AFTER_SECONDS), a backup model is launched
      in parallel; whichever produces the first word wins and the loser is cancelled.
    Returns the full text, or None if every model failed.
    """
    pending = list(models)
    active: dict[str, tuple[queue.Queue, threading.Event]] = {}
    last_launch = 0.0

    def launch() -> None:
        nonlocal last_launch
        m = pending.pop(0)
        q: queue.Queue = queue.Queue()
        c = threading.Event()
        threading.Thread(target=_stream_attempt, args=(m, contents, system, q, c), daemon=True).start()
        active[m] = (q, c)
        last_launch = time.monotonic()
        logger.info("Streaming via %s ...", m)

    launch()
    winner, first_text = None, ""
    while winner is None:
        if not active:
            if not pending:
                return None
            launch()
        elif pending and len(active) < 2 and time.monotonic() - last_launch >= HEDGE_AFTER_SECONDS:
            launch()  # primary is slow -> race a backup

        progressed = False
        for m, (q, _c) in list(active.items()):
            try:
                kind, val = q.get_nowait()
            except queue.Empty:
                continue
            progressed = True
            if kind == "text":
                winner, first_text = m, val
                break
            logger.warning("Model %s unavailable (%s)", m, val if kind == "fail" else "empty")
            del active[m]
        if not progressed and winner is None:
            time.sleep(0.015)

    for m, (_q, c) in active.items():
        if m != winner:
            c.set()
    logger.info("Answer streaming from %s", winner)

    win_q = active[winner][0]
    parts = [first_text]
    out_q.put(first_text)
    while True:
        kind, val = win_q.get()
        if kind != "text":
            break
        parts.append(val)
        out_q.put(val)
    return "".join(parts)


def _try_stream(model: str, contents: list, system: str, out_q: queue.Queue, text_accum: list = None) -> bool:
    """Backwards-compatible single-model stream (delegates to the hedged engine)."""
    text = _hedged_stream([model], contents, system, out_q)
    if text and text_accum is not None:
        text_accum.append(text)
    return bool(text)


def _try_nonstream(model: str, contents: list, system: str) -> str | None:
    url = (f"https://generativelanguage.googleapis.com/v1/models/"
           f"{model}:generateContent?key={GEMINI_API_KEY}")
    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": MAX_TOKENS, "temperature": 0.35}
    }
    try:
        resp = _SESSION.post(url, json=payload, timeout=(5, 25),
                             headers={"Content-Type": "application/json"})
        if resp.status_code != 200:
            return None
        data = resp.json()
        parts = data["candidates"][0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except Exception:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# STREAM WORKER
# ══════════════════════════════════════════════════════════════════════════════
def _stream_worker(messages, user_role, language, industry, user_email, current_chat_id, out_q):
    try:
        if not GEMINI_API_KEY:
            out_q.put("⚠️ No Gemini API key found. Please check your `.env` configuration file.")
            return

        # Extract clean user query for multi-source search
        last_user = next((m.get("content") for m in reversed(messages) if m.get("role") == "user"), "")
        clean_query = re.sub(r'\[IMAGE_BASE64\]:\S+', '', str(last_user)).strip()

        # 1. Detect Real-Time Tone, User Frustration & Urgency
        tone_instructions = ""
        try:
            from backend.sentiment_detector import detect_tone
            tone_data = detect_tone(clean_query)
            tone_instructions = tone_data.get("instructions", "")
            if tone_data.get("is_frustrated") or tone_data.get("is_crisis"):
                logger.info("Real-time sentiment detected: %s (Triggers: %s)", tone_data.get("frustration_level"), tone_data.get("triggers"))
        except Exception as e:
            logger.debug("Tone detection error: %s", e)

        # 2. Continuous Long-Term Enterprise Memory
        memory_context = ""
        try:
            from backend.memory_engine import get_memory_prompt_context, update_memory_profile
            update_memory_profile(industry=industry, role=user_role)
            memory_context = get_memory_prompt_context()
        except Exception as e:
            logger.debug("Memory engine error: %s", e)

        # 3. Query persistent Knowledge Vault for proprietary uploaded company data
        try:
            from backend.knowledge_engine import search_learned_knowledge
            learned_ctx = search_learned_knowledge(clean_query)
        except Exception as e:
            logger.debug("Knowledge vault search error: %s", e)
            learned_ctx = ""

        # 4. Gather real-time multi-source web dossier
        web_ctx = get_web_context(clean_query)

        # 5. Retrieve user's previous conversations for cross-session recall
        past_chats_ctx = ""
        try:
            from backend.history_manager import search_past_conversations
            past_chats_ctx = search_past_conversations(
                user_email=user_email,
                query=clean_query,
                current_chat_id=current_chat_id
            )
        except Exception as e:
            logger.debug("Past chats search error: %s", e)

        # 6. Query Enterprise Textile ERP if active industry is 'textile'
        erp_ctx = ""
        if str(industry or "").lower() == "textile":
            try:
                from backend.textile_erp import query_textile_erp
                erp_res = query_textile_erp(clean_query)
                if erp_res.get("matched") and erp_res.get("markdown_summary"):
                    erp_ctx = (
                        f"Connected ERP Node: {erp_res.get('erp_system', 'SAP S/4HANA Textile & Datatex NOW')}\n"
                        f"Operational Intent: {erp_res.get('intent')}\n"
                        f"{erp_res.get('markdown_summary')}\n"
                    )
            except Exception as e:
                logger.debug("Textile ERP query error: %s", e)

        # 7. Intercept casual greetings & conversational openings ("hi", "hello", "hey", "hello there", etc.)
        is_greeting = bool(re.match(
            r'^(?:(?:hi|hello|hey|greetings|howdy|sup|hola|namaste|hlo|heyy|heya|yo|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|apex|assistant|friend|everyone|everybody|all|team|folks))?)[!?., ]*$',
            clean_query.strip(),
            re.IGNORECASE
        ))
        if is_greeting:
            # Suppress past transcripts, plant memory, and ERP dumps for simple greetings
            past_chats_ctx = ""
            memory_context = ""
            erp_ctx = ""
            web_ctx = ""
            learned_ctx = ""
            tone_instructions = (
                "[CREATIVE CASUAL GREETING DIRECTIVE]:\n"
                "- The user gave a casual greeting ('" + clean_query + "').\n"
                "- Greet them with a creative, impromptu, varied, and witty 1 to 2 lines.\n"
                "- DO NOT give the same generic answer every time; make each greeting fresh, spontaneous, and engaging.\n"
                "- DO NOT mention any specific industry (textile, pharma, automotive, etc.), machine status, plant reports, or batch issues!\n"
                "- Simply welcome them warmly and express readiness to assist with whatever is on their mind today."
            )

        effective_role = "GENERAL" if is_greeting else user_role
        effective_industry = "general" if is_greeting else industry

        system  = _make_system(
            user_role=effective_role,
            language=language,
            industry=effective_industry,
            memory_context=memory_context,
            tone_instructions=tone_instructions
        )
        contents = _build_contents(messages, web_ctx, learned_ctx, past_chats_ctx, erp_ctx=erp_ctx)

        if not contents:
            out_q.put("Please enter your question.")
            return

        # Prioritize selected model from environment if present
        env_model = os.getenv("GEMINI_MODEL", "")
        priority_models = [env_model] if env_model and env_model in MODELS else []
        for m in MODELS:
            if m not in priority_models:
                priority_models.append(m)

        def _finish_in_background(answer: str) -> None:
            # Memory / knowledge learning / autonomous actions never delay the user's answer
            threading.Thread(
                target=_process_response_actions_and_learning,
                args=(clean_query, answer, user_role),
                daemon=True,
            ).start()

        # Round 1: Hedged low-latency streaming across the model pool
        full_text = _hedged_stream(priority_models, contents, system, out_q)
        if full_text:
            _finish_in_background(full_text)
            return

        # Round 2: Non-streaming fallback (only if every stream failed)
        logger.info("Streaming failed across pool — attempting non-stream fallback...")
        for model in priority_models:
            text = _try_nonstream(model, contents, system)
            if text:
                words = text.split(" ")
                for i in range(0, len(words), 6):
                    out_q.put(" ".join(words[i:i + 6]) + " ")
                logger.info("Non-stream fallback succeeded via %s", model)
                _finish_in_background(text)
                return

        out_q.put(
            "Google Gemini servers are currently experiencing peak traffic volume. "
            "Please re-send your question in 20 seconds."
        )
    except Exception as e:
        logger.exception("Fatal error in stream worker: %s", e)
        out_q.put(f"⚠️ APEX server encountered an unexpected error: {str(e)[:150]}. Please try re-sending.")
    finally:
        out_q.put(None)


# ══════════════════════════════════════════════════════════════════════════════
# ASYNC SSE GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
async def stream_response(
    messages: list[dict],
    user_role: str = "OPERATOR",
    language: str = "en",
    industry: str = "textile",
    user_email: str = "",
    current_chat_id: Any = None,
) -> AsyncGenerator[str, None]:
    import asyncio
    out_q: queue.Queue = queue.Queue()
    t = threading.Thread(
        target=_stream_worker,
        args=(messages, user_role, language, industry, user_email, current_chat_id, out_q),
        daemon=True,
    )
    t.start()
    loop = asyncio.get_event_loop()
    while True:
        chunk = await loop.run_in_executor(None, out_q.get)
        if chunk is None:
            break
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"
