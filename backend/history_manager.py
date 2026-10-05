"""
APEX Persistent Chat History Manager
Saves, loads, and manages full cross-session conversation transcripts permanently on disk.
"""
from __future__ import annotations
import json
import logging
import os
import re
import threading
from typing import Any

logger = logging.getLogger("apex.history")

HISTORY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "history")
HISTORY_FILE = os.path.join(HISTORY_DIR, "chat_history.json")
_lock = threading.Lock()

def _ensure_dir():
    os.makedirs(HISTORY_DIR, exist_ok=True)
    if not os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

def load_history(user_email: str | None = None) -> list[dict[str, Any]]:
    """Loads all chat sessions sorted by latest first, optionally filtered by user_email."""
    _ensure_dir()
    with _lock:
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    if user_email:
                        email_lower = user_email.strip().lower()
                        return [c for c in data if not c.get("user_email") or c.get("user_email", "").lower() == email_lower]
                    return data
                return []
        except Exception as e:
            logger.error("Error loading chat history: %s", e)
            return []

def save_chat_session(session: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Saves or updates a chat session on disk.
    Strips raw heavy base64 strings so disk storage remains compact, fast, and durable.
    """
    _ensure_dir()
    session_id = session.get("id")
    if not session_id:
        return load_history()

    clean_messages = []
    for m in session.get("messages", []):
        content = m.get("content", "")
        # Remove giant base64 payloads to preserve lightweight disk storage
        content = re.sub(r'\[IMAGE_BASE64\]:[A-Za-z0-9+/=]+', '[Attached Image]', content)
        clean_messages.append({
            "role": m.get("role", "user"),
            "content": content
        })

    title = session.get("title") or "Conversation"
    created_at = session.get("createdAt") or ""
    user_email = (session.get("user_email") or "").strip().lower()

    clean_session = {
        "id": session_id,
        "title": title[:80],
        "createdAt": created_at,
        "user_email": user_email,
        "messages": clean_messages
    }

    with _lock:
        try:
            history = []
            if os.path.exists(HISTORY_FILE):
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    history = json.load(f)
                if not isinstance(history, list):
                    history = []

            # Remove existing session with same ID if present
            history = [c for c in history if str(c.get("id")) != str(session_id)]
            # Prepend newest session to top
            history.insert(0, clean_session)
            # Keep up to 50 historical chats permanently
            history = history[:50]

            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
            return history
        except Exception as e:
            logger.error("Error saving chat session: %s", e)
            return []

def delete_chat_session(session_id: int | str) -> list[dict[str, Any]]:
    """Deletes a single chat session by ID."""
    _ensure_dir()
    with _lock:
        try:
            history = []
            if os.path.exists(HISTORY_FILE):
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    history = json.load(f)
            history = [c for c in history if str(c.get("id")) != str(session_id)]
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=2, ensure_ascii=False)
            return history
        except Exception as e:
            logger.error("Error deleting chat session %s: %s", session_id, e)
            return []

def clear_all_history() -> bool:
    """Clears all chat history from disk."""
    _ensure_dir()
    with _lock:
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)
            return True
        except Exception as e:
            logger.error("Error clearing chat history: %s", e)
            return False


def search_past_conversations(
    user_email: str | None = None,
    query: str = "",
    current_chat_id: int | str | None = None
) -> str:
    """
    Search and synthesize past conversation sessions for the active user.
    Extracts session titles, dates, user questions, and APEX responses so
    APEX can answer questions like 'provide information from previous chats'
    or 'what did we discuss yesterday?'.
    """
    sessions = load_history(user_email=user_email)
    if not sessions:
        return ""

    # Filter out current active session if ID provided
    other_sessions = [s for s in sessions if str(s.get("id")) != str(current_chat_id)]
    if not other_sessions:
        other_sessions = sessions

    # Detect if query explicitly inquires about past chats
    q_lower = query.lower()
    explicit_history_request = any(kw in q_lower for kw in [
        "previous", "earlier", "past", "history", "yesterday", "last time",
        "last chat", "prior", "before", "remember", "recall", "what did i ask",
        "what did we discuss", "previous chat", "previous chats", "old chats"
    ])

    lines = ["--- USER'S SAVED PREVIOUS CONVERSATIONS (Cross-Session Enterprise Transcripts) ---"]
    lines.append(f"The user has {len(other_sessions)} recorded past conversation session(s) in their history:")

    # Take up to 10 most recent sessions
    max_sessions = 10 if explicit_history_request else 5
    for idx, s in enumerate(other_sessions[:max_sessions], start=1):
        s_title = s.get("title", "Untitled Session")
        s_date = s.get("createdAt", "Recent")
        msgs = s.get("messages", [])

        # Extract first 2 user queries and assistant summaries
        user_queries = []
        assistant_points = []
        for m in msgs:
            role = m.get("role", "")
            content = str(m.get("content", "")).strip()
            if role == "user":
                clean_q = re.sub(r'\[IMAGE_BASE64\]:\S+|\[Attached.*?\]', '', content).strip()
                if clean_q and len(clean_q) > 3:
                    user_queries.append(clean_q[:140])
            elif role == "assistant":
                clean_a = re.sub(r'```.*?```', '', content, flags=re.DOTALL)
                clean_a = re.sub(r'[*#_`]', '', clean_a).strip()
                if clean_a:
                    first_line = clean_a.split("\n")[0][:150]
                    assistant_points.append(first_line)

        lines.append(f"\n[Past Session #{idx}: \"{s_title}\" | Date: {s_date}]")
        if user_queries:
            lines.append(f"  • User Topics Asked: {'; '.join(user_queries[:3])}")
        if assistant_points:
            lines.append(f"  • Key APEX Insight Provided: {'; '.join(assistant_points[:2])}")

        # If explicit request, include deeper dialogue transcript
        if explicit_history_request and msgs:
            lines.append("  • Dialogue Excerpts:")
            for m in msgs[:6]:
                role_label = "User" if m.get("role") == "user" else "APEX"
                c = re.sub(r'```.*?```', '', str(m.get("content", "")), flags=re.DOTALL)
                c = re.sub(r'[*#_`]', '', c).strip()[:180]
                if c:
                    lines.append(f"    - {role_label}: {c}")

    lines.append("\nINSTRUCTION FOR ANSWERING: You have full access to these previous conversations. When the user asks about previous chats, what was discussed earlier, or references past information, synthesize and provide the exact requested details clearly, citing the past session topic and date.")
    return "\n".join(lines)
