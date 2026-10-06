"""
APEX FastAPI Backend — Universal Multi-File, Voice & Intelligence API
"""
from __future__ import annotations
import json
import logging
import os
from typing import Any

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
import pandas as pd

from backend.agent import stream_response
from backend.file_processor import (
    EXPORTS_DIR,
    export_dataframe_to_csv,
    export_dataframe_to_excel,
    process_file_payload,
)
from backend.knowledge_engine import (
    clear_knowledge,
    get_knowledge_stats,
    learn_document,
)
from backend.history_manager import (
    load_history,
    save_chat_session,
    delete_chat_session,
    clear_all_history,
)
from backend.tunnel_manager import get_share_info
from backend.document_generator import (
    generate_pdf_report,
    generate_pptx_deck,
    generate_excel_workbook,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("apex.api")

app = FastAPI(title="APEX Universal Intelligence", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/") or request.url.path == "/":
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
    return response


def _render_keepalive_daemon():
    """
    Pings the Render live URL every 9 minutes to keep the cloud container
    awake 24/7 so mobile and desktop users never experience cold-start delays.
    """
    import time
    import requests
    time.sleep(30)
    target_url = os.getenv("RENDER_EXTERNAL_URL", "https://apex-ai-platform-q79y.onrender.com")
    health_url = f"{target_url.rstrip('/')}/api/health"
    while True:
        try:
            r = requests.get(health_url, timeout=12)
            logger.info("Render keep-alive ping status: %s (container active 24/7)", r.status_code)
        except Exception as ex:
            logger.debug("Render keep-alive ping note: %s", ex)
        time.sleep(540)  # Ping every 9 minutes


@app.on_event("startup")
async def on_startup():
    try:
        import sys
        if sys.platform == "win32":
            import ctypes
            # ES_CONTINUOUS (0x80000000) | ES_SYSTEM_REQUIRED (0x00000001) | ES_AWAYMODE_REQUIRED (0x00000040)
            ctypes.windll.kernel32.SetThreadExecutionState(0x80000000 | 0x00000001 | 0x00000040)
            logger.info("Kernel execution state configured: Windows sleep prevented & AwayMode enabled.")
    except Exception as e:
        logger.warning("Could not set Windows execution state: %s", e)

    try:
        from backend.tunnel_daemon import start_tunnel_daemon
        start_tunnel_daemon()
    except Exception as e:
        logger.warning("Could not auto-start tunnel daemon: %s", e)

    try:
        import threading
        threading.Thread(target=_render_keepalive_daemon, daemon=True).start()
        logger.info("Keep-alive 24/7 cloud background pinger activated.")
    except Exception as e:
        logger.warning("Could not start keep-alive daemon: %s", e)



_base = os.path.dirname(os.path.dirname(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(_base, "frontend", "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(_base, "frontend", "templates"))


# ── Schemas ────────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: str = "user"
    content: Any = ""

class ChatRequest(BaseModel):
    messages:  list[Message] = Field(default_factory=list, description="Full conversation history")
    user_role: str = Field("GENERAL")
    language:  str = Field("auto", description="auto | en | hi | pa | hinglish | ...")
    industry:  str = Field("general", description="general|textile|pharma|auto|food|construction|logistics")
    user_email: str = Field("", description="Active user email for cross-session history recall")
    current_chat_id: Any = Field(None, description="Active chat session ID")

class DocumentGenerateRequest(BaseModel):
    type: str = Field("pdf", description="pdf | pptx | excel")
    title: str = Field("APEX Technical Dossier")
    subtitle: str = Field("")
    raw_markdown: str = Field("")
    sections: list[dict[str, Any]] = Field(default_factory=list)
    sheets: list[dict[str, Any]] = Field(default_factory=list)
    author: str = Field("APEX Universal Intelligence")

class ExportRequest(BaseModel):
    format: str = Field("excel", description="excel | csv")
    title: str = Field("apex_report")
    rows: list[dict[str, Any]] = Field(..., description="List of row dictionaries")

class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Prompt or query describing the desired visual")
    user_q: str = Field("", description="Optional original user question")
    apex_reply: str = Field("", description="Optional assistant answer text for contextual relevance")

class VideoGenerateRequest(BaseModel):
    prompt: str = Field(..., description="Prompt or query describing the desired video")
    user_q: str = Field("", description="Optional original user question")
    apex_reply: str = Field("", description="Optional assistant answer text for contextual relevance")

class OperationExecuteRequest(BaseModel):
    tool: str = Field(..., description="update_record | book_system | run_workflow | log_incident")
    target: str = Field(..., description="qc_records | inventory | maintenance_schedule | equipment_slots | capa_workflows | incident_logs")
    payload: dict[str, Any] = Field(default_factory=dict)
    record_id: str | None = Field(None)
    summary: str = Field("")
    author: str = Field("User via Web Interface")


# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/api/generate-image")
async def generate_image_endpoint(req: ImageGenerateRequest):
    """
    Synthesize and serve ultra-high-definition photorealistic industrial imagery on demand.
    """
    try:
        from backend.image_generator import generate_image_dossier
        res = generate_image_dossier(req.prompt, req.user_q, req.apex_reply)
        return res
    except Exception as e:
        logger.error("Image generation error: %s", e)
        from backend.image_generator import generate_cyber_hud_render
        fname = f"apex_render_fallback.jpg"
        generate_cyber_hud_render(req.prompt[:40], "High-fidelity industrial visual render", fname)
        return {
            "status": "success",
            "image_url": f"/static/generated_images/{fname}",
            "caption": req.prompt[:40],
            "prompt": req.prompt,
            "source": "fallback"
        }


@app.post("/api/generate-video")
async def generate_video_endpoint(req: VideoGenerateRequest):
    """
    Synthesize and serve ultra-high-definition cinematic MP4 video clips on demand.
    """
    try:
        from backend.video_generator import generate_video_dossier
        res = generate_video_dossier(req.prompt, req.user_q, req.apex_reply)
        return res
    except Exception as e:
        logger.error("Video generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")


@app.get("/", response_class=HTMLResponse)
async def serve_ui(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "APEX Premium AI Intelligence"}


@app.get("/api/knowledge")
async def get_knowledge():
    """Retrieve overview of all documents learned into the APEX Knowledge Vault."""
    return get_knowledge_stats()


@app.delete("/api/knowledge/{doc_id}")
async def delete_knowledge_doc(doc_id: str):
    """Delete a specific learned document from the vault."""
    success = clear_knowledge(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document ID not found in Knowledge Vault.")
    return {"status": "deleted", "doc_id": doc_id, "stats": get_knowledge_stats()}


@app.delete("/api/knowledge")
async def clear_all_knowledge():
    """Reset all learned knowledge in the vault."""
    clear_knowledge(None)
    return {"status": "cleared", "stats": get_knowledge_stats()}


@app.get("/api/operations/records")
async def get_operations_records():
    """Retrieve full operations database records."""
    from backend.operations_engine import get_all_records
    return get_all_records()


@app.post("/api/operations/execute")
async def execute_operation_endpoint(req: OperationExecuteRequest):
    """Execute autonomous or manual tool action on operations database."""
    from backend.operations_engine import execute_operation
    res = execute_operation(
        tool=req.tool,
        target=req.target,
        payload=req.payload,
        record_id=req.record_id,
        summary=req.summary,
        author=req.author
    )
    return res


@app.get("/api/memory")
async def get_memory_endpoint():
    """Retrieve continuous cross-session memory profile."""
    from backend.memory_engine import get_memory
    return get_memory()


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Universal file upload endpoint.
    Accepts PDFs, Excel spreadsheets (.xlsx, .xls), CSVs, Word (.docx),
    images (.jpg, .png, .webp), videos, audio, text, code, etc.
    Automatically indexes and permanently learns the content into APEX's Knowledge Vault.
    """
    try:
        content = await file.read()
        logger.info("Received file '%s' (%d bytes)", file.filename, len(content))
        result = process_file_payload(file.filename or "uploaded_file", content)

        # Permanently learn into Knowledge Vault if text/data content exists
        text_content = result.get("text_content")
        if text_content and len(text_content.strip()) > 30:
            learn_info = learn_document(
                filename=result.get("filename", file.filename or "uploaded_file"),
                content_type=result.get("content_type", "document"),
                parsed_text=text_content
            )
            result["learned"] = learn_info
            result["vault_stats"] = get_knowledge_stats()

        return result
    except Exception as e:
        logger.error("Upload error for '%s': %s", file.filename, e)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


@app.post("/api/export")
async def export_data(req: ExportRequest):
    """
    Generate and download Excel (.xlsx) or CSV files on demand.
    """
    try:
        if not req.rows:
            raise HTTPException(status_code=400, detail="No data rows provided for export.")
        df = pd.DataFrame(req.rows)
        if req.format.lower() == "csv":
            filename = export_dataframe_to_csv(df, req.title)
        else:
            filename = export_dataframe_to_excel(df, req.title)
        return {
            "status": "success",
            "filename": filename,
            "download_url": f"/api/download/{filename}"
        }
    except Exception as e:
        logger.error("Export error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """
    Download generated exports (Excel spreadsheets, CSVs, reports, PDFs, PPTXs).
    """
    safe_filename = os.path.basename(filename)
    from backend.document_generator import EXPORTS_DIR as STATIC_EXPORTS_DIR
    for d in (STATIC_EXPORTS_DIR, EXPORTS_DIR):
        file_path = os.path.join(d, safe_filename)
        if os.path.isfile(file_path):
            return FileResponse(file_path, filename=safe_filename)
    raise HTTPException(status_code=404, detail="Requested export file not found.")


@app.get("/api/share-info")
async def get_share_links():
    """Dynamically returns verified live public and local Wi-Fi links for sharing."""
    return get_share_info()


@app.post("/api/documents/generate")
async def generate_document_endpoint(req: DocumentGenerateRequest):
    """
    Generate professional PDF reports, PowerPoint presentations, or Excel spreadsheets on demand.
    """
    try:
        doc_type = req.type.lower()
        if doc_type == "pdf":
            res = generate_pdf_report(
                title=req.title,
                subtitle=req.subtitle,
                sections=req.sections,
                raw_markdown=req.raw_markdown,
                author=req.author,
            )
        elif doc_type in ("pptx", "ppt", "presentation"):
            res = generate_pptx_deck(
                title=req.title,
                subtitle=req.subtitle,
                raw_markdown=req.raw_markdown,
                author=req.author,
            )
        elif doc_type in ("excel", "xlsx", "sheet", "spreadsheet"):
            res = generate_excel_workbook(
                title=req.title,
                sheets=req.sheets,
                raw_markdown=req.raw_markdown,
                author=req.author,
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported document type: {req.type}")
        return res
    except Exception as e:
        logger.error("Document generation error: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")


# ── Textile ERP Integration Endpoints ─────────────────────────────────────────
class QuoteRequest(BaseModel):
    fabric_code: str = Field("FAB-COT-180")
    yardage_meters: float = Field(1500.0)

class FourPointRequest(BaseModel):
    defect_points: int = Field(18)
    length_yards: float = Field(100.0)
    width_inches: float = Field(60.0)

class LabDipRequest(BaseModel):
    l_std: float = Field(42.5)
    a_std: float = Field(18.2)
    b_std: float = Field(-24.1)
    l_batch: float = Field(42.8)
    a_batch: float = Field(18.4)
    b_batch: float = Field(-23.9)


@app.get("/api/erp/overview")
async def get_erp_overview():
    """Returns top-level Textile ERP status, daily production output, and key metrics."""
    from backend.textile_erp import ORDERS_DB, FABRIC_INVENTORY_DB, PRODUCTION_STATUS_DB, RAW_MATERIALS_DB
    return {
        "status": "connected",
        "erp_system": "SAP S/4HANA Textile & Datatex NOW Connector",
        "production": {
            "daily_target": PRODUCTION_STATUS_DB["daily_target_meters"],
            "achieved_today": PRODUCTION_STATUS_DB["achieved_meters_today"],
            "efficiency": PRODUCTION_STATUS_DB["efficiency_percentage"],
            "scrap_rate": PRODUCTION_STATUS_DB["current_scrap_rate"],
            "active_machines": len(PRODUCTION_STATUS_DB["machines"])
        },
        "inventory": {
            "total_fabrics_cataloged": len(FABRIC_INVENTORY_DB),
            "total_meters_in_stock": sum(f["stock_meters"] for f in FABRIC_INVENTORY_DB),
            "total_rolls_in_stock": sum(f["roll_count"] for f in FABRIC_INVENTORY_DB)
        },
        "shipments": {
            "active_orders": len(ORDERS_DB),
            "in_transit_orders": sum(1 for o in ORDERS_DB.values() if o["status_code"] == "IN_TRANSIT")
        },
        "raw_materials": {
            "total_yarn_stock_kg": sum(y["stock_kg"] for y in RAW_MATERIALS_DB["yarn_warehouse"]),
            "total_chemicals_kg": sum(c["stock_kg"] for c in RAW_MATERIALS_DB["dye_and_chemicals"])
        }
    }


@app.get("/api/erp/track/{order_id}")
async def track_order_endpoint(order_id: str):
    """Real-time fabric roll and container order tracking."""
    from backend.textile_erp import ORDERS_DB
    clean_id = order_id.upper().strip()
    if clean_id in ORDERS_DB:
        return ORDERS_DB[clean_id]
    for k, v in ORDERS_DB.items():
        if clean_id in k or clean_id in v.get("tracking_number", ""):
            return v
    raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found in Textile ERP.")


@app.get("/api/erp/inventory")
async def get_inventory_endpoint(gsm: Optional[int] = None, q: Optional[str] = None):
    """Filterable fabric finished goods inventory."""
    from backend.textile_erp import FABRIC_INVENTORY_DB
    res = FABRIC_INVENTORY_DB
    if gsm:
        res = [f for f in res if f["gsm"] == gsm]
    if q:
        q_lower = q.lower()
        res = [f for f in res if q_lower in f["name"].lower() or q_lower in f["composition"].lower() or any(q_lower in c.lower() for c in f["colors_available"])]
    return res


@app.get("/api/erp/production")
async def get_production_endpoint():
    """Shopfloor loom, stenter, and dyehouse telemetry."""
    from backend.textile_erp import PRODUCTION_STATUS_DB
    return PRODUCTION_STATUS_DB


@app.get("/api/erp/raw-materials")
async def get_raw_materials_endpoint():
    """Warehouse yarn, dyes, and chemical inventory."""
    from backend.textile_erp import RAW_MATERIALS_DB
    return RAW_MATERIALS_DB


@app.get("/api/erp/suppliers")
async def get_suppliers_endpoint():
    """Incoming cotton bale and chemical shipments with PO status."""
    from backend.textile_erp import SUPPLIER_SHIPMENTS_DB
    return SUPPLIER_SHIPMENTS_DB


@app.post("/api/erp/quote")
async def get_quote_endpoint(req: QuoteRequest):
    """Dynamic pricing, MOQ, and Incoterm calculation."""
    from backend.textile_erp import _calculate_price_quote_from_prompt
    return _calculate_price_quote_from_prompt(f"{req.fabric_code} {req.yardage_meters} meters")


@app.post("/api/erp/4point")
async def calculate_4point_endpoint(req: FourPointRequest):
    """ASTM D5430 4-Point System quality penalty points calculation."""
    from backend.textile_erp import calculate_4point_inspection
    return calculate_4point_inspection(req.defect_points, req.length_yards, req.width_inches)


@app.post("/api/erp/delta-e")
async def calculate_delta_e_endpoint(req: LabDipRequest):
    """Spectrophotometer Delta E CMC 2:1 shade match acceptability."""
    from backend.textile_erp import calculate_lab_dip_delta_e
    return calculate_lab_dip_delta_e(req.l_std, req.a_std, req.b_std, req.l_batch, req.a_batch, req.b_batch)


@app.post("/api/chat/stream")
async def chat_stream(req: ChatRequest):
    messages = [{"role": str(m.role or "user"), "content": str(m.content or "")} for m in req.messages]
    return StreamingResponse(
        stream_response(
            messages=messages,
            user_role=req.user_role,
            language=req.language,
            industry=req.industry,
            user_email=req.user_email,
            current_chat_id=req.current_chat_id,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Authentication API ────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(...)
    password: str = Field(..., min_length=4)
    role: str = Field("GENERAL")
    industry: str = Field("general")

class LoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)


@app.post("/api/auth/register")
async def register_account(req: RegisterRequest):
    from backend.auth_manager import register_user
    success, message, profile = register_user(
        name=req.name,
        email=req.email,
        password=req.password,
        role=req.role,
        industry=req.industry
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {"status": "success", "message": message, "user": profile}


@app.post("/api/auth/login")
async def login_account(req: LoginRequest):
    from backend.auth_manager import authenticate_user
    success, message, profile = authenticate_user(
        email=req.email,
        password=req.password
    )
    if not success:
        raise HTTPException(status_code=401, detail=message)
    return {"status": "success", "message": message, "user": profile}


@app.get("/api/auth/me")
async def get_current_user_profile(email: str = ""):
    from backend.auth_manager import get_user_profile
    if not email:
        raise HTTPException(status_code=400, detail="Email parameter required")
    profile = get_user_profile(email)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "user": profile}


# ── Persistent Chat History API ────────────────────────────────────────────────
class HistorySaveRequest(BaseModel):
    id: Any
    title: str = "Conversation"
    createdAt: str = ""
    user_email: str = ""
    messages: list[dict[str, Any]] = []


@app.get("/api/history")
async def get_chat_history(user_email: str = ""):
    """Fetch all cross-session conversations permanently stored on disk."""
    return {"status": "success", "history": load_history(user_email=user_email if user_email else None)}


@app.post("/api/history/save")
async def save_chat_history_session(req: HistorySaveRequest):
    """Save or update a conversation session permanently to server disk."""
    saved = save_chat_session(req.model_dump())
    return {"status": "success", "history": saved}


@app.delete("/api/history/{chat_id}")
async def delete_chat_history_session(chat_id: str):
    """Delete a conversation session permanently from disk."""
    saved = delete_chat_session(chat_id)
    return {"status": "success", "history": saved}


@app.post("/api/history/clear")
async def clear_all_chat_history():
    """Clear all chat history permanently from disk."""
    clear_all_history()
    return {"status": "success", "history": []}

