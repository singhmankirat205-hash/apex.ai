"""
APEX Universal File Intelligence Engine
=======================================
Supports:
- PDF extraction (text, tables, metadata via pypdf)
- Excel spreadsheets (.xlsx, .xls) & CSV (multi-sheet tables, stats via pandas/openpyxl)
- Images (.jpg, .png, .webp) -> Base64 for Gemini Vision
- Text, Code, JSON, Word documents (.docx)
- Video / Audio metadata analysis (.mp4, .mp3, .wav, .mov)
- File export generation (.xlsx, .csv, reports)
"""
from __future__ import annotations
import base64
import io
import json
import logging
import os
import re
import zipfile
from datetime import datetime
from typing import Any

import pandas as pd
import pypdf

logger = logging.getLogger("apex.files")

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
EXPORTS_DIR = os.path.join(BASE_DIR, "data", "exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)


def parse_pdf(file_bytes: bytes, filename: str) -> str:
    """Extract text, page count, and structure from a PDF file."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        num_pages = len(reader.pages)
        meta = reader.metadata or {}
        title = meta.get("/Title", filename) or filename

        extracted = [
            f"=== PDF DOCUMENT ANALYSIS: {filename} ===",
            f"• Total Pages: {num_pages}",
            f"• Document Title: {title}",
            "--- EXTRACTED CONTENT ---",
        ]

        total_words = 0
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            words = text.split()
            total_words += len(words)
            extracted.append(f"\n[PAGE {i + 1} of {num_pages}]:\n{text.strip()}")
            if total_words > 8000:
                extracted.append(f"\n[... Document truncated at page {i + 1} due to size. {num_pages - (i + 1)} more pages exist.]")
                break

        return "\n".join(extracted)
    except Exception as e:
        logger.error("PDF parse error: %s", e)
        return f"Error extracting PDF '{filename}': {str(e)}"


def parse_excel(file_bytes: bytes, filename: str) -> str:
    """Extract all sheets, table previews, row counts, and summary stats from an Excel file."""
    try:
        xls = pd.ExcelFile(io.BytesIO(file_bytes))
        sheet_names = xls.sheet_names

        extracted = [
            f"=== EXCEL WORKBOOK ANALYSIS: {filename} ===",
            f"• Sheets Found ({len(sheet_names)}): {', '.join(sheet_names)}",
            "--- SPREADSHEET DATA BREAKDOWN ---",
        ]

        for sname in sheet_names[:5]:  # Process up to 5 sheets
            df = pd.read_excel(xls, sheet_name=sname)
            rows, cols = df.shape
            extracted.append(f"\n### Sheet: '{sname}' ({rows} rows × {cols} columns)")
            extracted.append(f"• Columns: {', '.join(str(c) for c in df.columns)}")

            # Numeric summary
            num_cols = df.select_dtypes(include=['number']).columns
            if len(num_cols) > 0:
                extracted.append("• Statistical Overview (Mean, Min, Max):")
                stats_str = df[num_cols].agg(['mean', 'min', 'max']).round(2).to_string()
                extracted.append(stats_str)

            # Sample rows as Markdown table
            sample_df = df.head(12)
            try:
                table_md = sample_df.to_markdown(index=False)
                extracted.append(f"• Sample Data (First {len(sample_df)} rows):\n{table_md}")
            except Exception:
                extracted.append(f"• Sample Data:\n{sample_df.to_string(index=False)}")

        return "\n".join(extracted)
    except Exception as e:
        logger.error("Excel parse error: %s", e)
        return f"Error parsing Excel file '{filename}': {str(e)}"


def parse_csv(file_bytes: bytes, filename: str) -> str:
    """Parse CSV / TSV file into columns, statistics, and preview."""
    try:
        # Detect encoding
        try:
            text = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            text = file_bytes.decode('latin-1')

        sep = '\t' if filename.lower().endswith('.tsv') else ','
        df = pd.read_csv(io.StringIO(text), sep=sep)
        rows, cols = df.shape

        extracted = [
            f"=== CSV DATASET ANALYSIS: {filename} ===",
            f"• Dimensions: {rows} rows × {cols} columns",
            f"• Columns: {', '.join(str(c) for c in df.columns)}",
        ]

        # Numeric stats
        num_cols = df.select_dtypes(include=['number']).columns
        if len(num_cols) > 0:
            extracted.append("• Summary Statistics:\n" + df[num_cols].describe().round(2).to_string())

        # Markdown sample
        sample_df = df.head(15)
        try:
            extracted.append(f"• Data Preview (First {len(sample_df)} rows):\n" + sample_df.to_markdown(index=False))
        except Exception:
            extracted.append(f"• Data Preview:\n" + sample_df.to_string(index=False))

        return "\n".join(extracted)
    except Exception as e:
        return f"Error parsing CSV '{filename}': {str(e)}"


def parse_docx(file_bytes: bytes, filename: str) -> str:
    """Extract paragraphs and text from Word .docx file via XML extraction."""
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as docx:
            xml_content = docx.read('word/document.xml').decode('utf-8')
            # Extract text elements
            paragraphs = re.findall(r'<w:p[^>]*>(.*?)</w:p>', xml_content)
            extracted_text = []
            for p in paragraphs:
                texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p)
                if texts:
                    extracted_text.append(''.join(texts))

            content = "\n\n".join(extracted_text)
            return f"=== WORD DOCUMENT ANALYSIS: {filename} ===\n\n{content[:8000]}"
    except Exception as e:
        return f"Error reading Word document '{filename}': {str(e)}"


def parse_pptx(file_bytes: bytes, filename: str) -> str:
    """
    Extract slide-by-slide titles, bullet points, text frames, tables,
    and speaker notes from PowerPoint presentations (.pptx, .ppt).
    """
    try:
        from pptx import Presentation
        prs = Presentation(io.BytesIO(file_bytes))
        num_slides = len(prs.slides)

        extracted = [
            f"=== POWERPOINT PRESENTATION ANALYSIS: {filename} ===",
            f"• Total Slides: {num_slides}",
            "--- SLIDE-BY-SLIDE CONTENT ---",
        ]

        total_words = 0
        for idx, slide in enumerate(prs.slides, 1):
            slide_parts = [f"\n[SLIDE {idx} of {num_slides}]:"]

            # Slide title
            title = ""
            if slide.shapes.title and slide.shapes.title.text:
                title = slide.shapes.title.text.strip().replace("\n", " ")
                slide_parts.append(f"Title: {title}")

            # Slide body content & tables
            slide_texts = []
            for shape in slide.shapes:
                if shape == slide.shapes.title:
                    continue
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        p_text = paragraph.text.strip()
                        if p_text and p_text != title:
                            slide_texts.append(p_text)
                elif shape.has_table:
                    table_rows = []
                    for row in shape.table.rows:
                        row_cells = [cell.text.strip().replace("\n", " ") for cell in row.cells]
                        table_rows.append(" | ".join(row_cells))
                    if table_rows:
                        slide_texts.append("[Table]:\n" + "\n".join(table_rows))

            if slide_texts:
                slide_parts.append("\n".join(f"• {t}" if not t.startswith("[Table]") else t for t in slide_texts))
            else:
                slide_parts.append("(Visual / Diagram slide with minimal body text)")

            # Slide speaker notes
            try:
                if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                    notes = slide.notes_slide.notes_text_frame.text.strip()
                    if notes:
                        slide_parts.append(f"Speaker Notes: {notes}")
            except Exception:
                pass

            slide_text_joined = "\n".join(slide_parts)
            extracted.append(slide_text_joined)
            total_words += len(slide_text_joined.split())

            if total_words > 12000:
                extracted.append(f"\n[... Truncated after slide {idx}. {num_slides - idx} more slides exist.]")
                break

        return "\n".join(extracted)

    except Exception as e:
        logger.warning("python-pptx parse error, attempting zip XML fallback: %s", e)
        # Direct XML fallback for pptx archive
        try:
            with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
                slide_files = sorted([f for f in zf.namelist() if f.startswith("ppt/slides/slide") and f.endswith(".xml")])
                if not slide_files:
                    return f"=== POWERPOINT PRESENTATION: {filename} === (No readable slides found in presentation archive)"
                extracted = [
                    f"=== POWERPOINT PRESENTATION ANALYSIS: {filename} ===",
                    f"• Total Slides: {len(slide_files)}",
                    "--- SLIDE-BY-SLIDE CONTENT ---",
                ]
                for idx, sfile in enumerate(slide_files, 1):
                    xml_data = zf.read(sfile).decode("utf-8", errors="ignore")
                    texts = re.findall(r'<a:t[^>]*>(.*?)</a:t>', xml_data)
                    slide_body = " ".join(texts).strip() if texts else "(Visual content)"
                    extracted.append(f"\n[SLIDE {idx} of {len(slide_files)}]:\n{slide_body}")
                return "\n".join(extracted)
        except Exception as ex:
            return f"Error analyzing PowerPoint file '{filename}': {str(ex)}"


def parse_media_metadata(file_bytes: bytes, filename: str, is_video: bool = True) -> str:
    """Analyze video / audio container, file size, and parameters."""
    size_mb = len(file_bytes) / (1024 * 1024)
    media_type = "Video Recording" if is_video else "Audio Recording"
    return (
        f"=== {media_type.upper()} METADATA INSPECTION: {filename} ===\n"
        f"• File Name: {filename}\n"
        f"• File Size: {size_mb:.2f} MB\n"
        f"• Status: Successfully staged for industrial inspection and analysis.\n"
        f"• Ready for QA review, defect identification, and operational transcription."
    )


def process_file_payload(filename: str, file_bytes: bytes) -> dict[str, Any]:
    """
    Universal router for analyzing any uploaded file.
    Returns:
    {
      "filename": str,
      "file_type": str,
      "text_content": str,
      "image_base64": str | None,
      "display_summary": str
    }
    """
    ext = os.path.splitext(filename)[1].lower()
    result = {
        "filename": filename,
        "file_type": "unknown",
        "text_content": "",
        "image_base64": None,
        "display_summary": f"Uploaded {filename}"
    }

    # 1. Images
    if ext in ('.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'):
        result["file_type"] = "image"
        result["image_base64"] = base64.b64encode(file_bytes).decode('utf-8')
        result["text_content"] = f"[IMAGE FILE ATTACHED: {filename} — Ready for high-resolution visual defect and metrology analysis]"
        result["display_summary"] = f"🖼️ Image: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 2. PDF Documents
    if ext == '.pdf':
        result["file_type"] = "pdf"
        parsed = parse_pdf(file_bytes, filename)
        result["text_content"] = parsed
        result["display_summary"] = f"📄 PDF Document: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 3. PowerPoint Presentations (.pptx, .ppt)
    if ext in ('.pptx', '.ppt'):
        result["file_type"] = "pptx"
        parsed = parse_pptx(file_bytes, filename)
        result["text_content"] = parsed
        result["display_summary"] = f"📊 PowerPoint Presentation: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 4. Excel Spreadsheets
    if ext in ('.xlsx', '.xls'):
        result["file_type"] = "excel"
        parsed = parse_excel(file_bytes, filename)
        result["text_content"] = parsed
        result["display_summary"] = f"📊 Excel Workbook: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 5. CSV & TSV
    if ext in ('.csv', '.tsv'):
        result["file_type"] = "csv"
        parsed = parse_csv(file_bytes, filename)
        result["text_content"] = parsed
        result["display_summary"] = f"📈 CSV Dataset: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 6. Word Documents
    if ext in ('.docx', '.doc'):
        result["file_type"] = "docx"
        parsed = parse_docx(file_bytes, filename)
        result["text_content"] = parsed
        result["display_summary"] = f"📝 Word Document: {filename} ({len(file_bytes)//1024} KB)"
        return result

    # 7. Video & Audio
    if ext in ('.mp4', '.mov', '.avi', '.mkv', '.webm'):
        result["file_type"] = "video"
        result["text_content"] = parse_media_metadata(file_bytes, filename, is_video=True)
        result["display_summary"] = f"🎥 Video: {filename} ({len(file_bytes)/(1024*1024):.1f} MB)"
        return result

    if ext in ('.mp3', '.wav', '.ogg', '.m4a', '.flac'):
        result["file_type"] = "audio"
        result["text_content"] = parse_media_metadata(file_bytes, filename, is_video=False)
        result["display_summary"] = f"🎙️ Audio: {filename} ({len(file_bytes)/(1024*1024):.1f} MB)"
        return result

    # 7. Text, Code, JSON, Log, Config files
    try:
        try:
            text = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            text = file_bytes.decode('latin-1')

        result["file_type"] = "text"
        result["text_content"] = f"=== TEXT FILE CONTENT: {filename} ===\n\n{text[:12000]}"
        result["display_summary"] = f"📄 Text/Code: {filename} ({len(file_bytes)//1024} KB)"
        return result
    except Exception as e:
        result["text_content"] = f"File {filename} uploaded ({len(file_bytes)} bytes), raw binary format."
        return result


def export_dataframe_to_excel(df: pd.DataFrame, base_name: str = "apex_export") -> str:
    """Save a pandas DataFrame to an Excel file and return its filename."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', base_name)
    fname = f"{clean_name}_{timestamp}.xlsx"
    out_path = os.path.join(EXPORTS_DIR, fname)
    df.to_excel(out_path, index=False, engine='openpyxl')
    logger.info("Created Excel export: %s", out_path)
    return fname


def export_dataframe_to_csv(df: pd.DataFrame, base_name: str = "apex_export") -> str:
    """Save a pandas DataFrame to a CSV file and return its filename."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', base_name)
    fname = f"{clean_name}_{timestamp}.csv"
    out_path = os.path.join(EXPORTS_DIR, fname)
    df.to_csv(out_path, index=False)
    logger.info("Created CSV export: %s", out_path)
    return fname
