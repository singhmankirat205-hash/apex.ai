"""
APEX Enterprise Authentication Manager
Handles user registration, credential verification, and persistent account profiles.
"""
from __future__ import annotations
import hashlib
import json
import logging
import os
import secrets
import threading
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("apex.auth")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
_lock = threading.RLock()

def _hash_password(password: str, salt: str) -> str:
    """Derives secure PBKDF2-HMAC-SHA256 password hash."""
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        25_000
    ).hex()

def _ensure_users_file():
    os.makedirs(DATA_DIR, exist_ok=True)
    with _lock:
        if not os.path.exists(USERS_FILE):
            # Pre-seed a default demo user for frictionless immediate testing
            salt = secrets.token_hex(16)
            default_demo = {
                "id": "usr_demo",
                "name": "Alex Vance (Lead Engineer)",
                "email": "demo@apex.ai",
                "salt": salt,
                "password_hash": _hash_password("apex2026", salt),
                "role": "ENGINEER",
                "industry": "general",
                "createdAt": datetime.now(timezone.utc).isoformat()
            }
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump([default_demo], f, indent=2)

def _load_all_users() -> list[dict[str, Any]]:
    _ensure_users_file()
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception as e:
        logger.error("Error reading users file: %s", e)
        return []

def _save_all_users(users: list[dict[str, Any]]) -> bool:
    try:
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, indent=2)
        return True
    except Exception as e:
        logger.error("Error writing users file: %s", e)
        return False

def register_user(
    name: str,
    email: str,
    password: str,
    role: str = "GENERAL",
    industry: str = "general"
) -> tuple[bool, str, dict[str, Any] | None]:
    """
    Registers a new user account.
    Returns (success, message, user_profile).
    """
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = (password or "").strip()

    if not name or len(name) < 2:
        return False, "Full Name must be at least 2 characters.", None
    if not email or "@" not in email or "." not in email:
        return False, "Please provide a valid corporate or personal email address.", None
    if not password or len(password) < 4:
        return False, "Password must be at least 4 characters long.", None

    with _lock:
        users = _load_all_users()
        for u in users:
            if u.get("email", "").lower() == email:
                return False, f"An account with email '{email}' already exists. Please sign in.", None

        salt = secrets.token_hex(16)
        user_id = f"usr_{secrets.token_hex(6)}"
        user_record = {
            "id": user_id,
            "name": name,
            "email": email,
            "salt": salt,
            "password_hash": _hash_password(password, salt),
            "role": role or "GENERAL",
            "industry": industry or "general",
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        users.append(user_record)
        _save_all_users(users)

    profile = {
        "id": user_record["id"],
        "name": user_record["name"],
        "email": user_record["email"],
        "role": user_record["role"],
        "industry": user_record["industry"],
        "token": f"apex_tok_{secrets.token_hex(18)}"
    }
    return True, "Account created successfully.", profile

def authenticate_user(email: str, password: str) -> tuple[bool, str, dict[str, Any] | None]:
    """
    Validates user credentials.
    Returns (success, message, user_profile).
    """
    email = (email or "").strip().lower()
    password = (password or "").strip()

    if not email or not password:
        return False, "Email and password are required.", None

    users = _load_all_users()
    target_user = None
    for u in users:
        if u.get("email", "").lower() == email:
            target_user = u
            break

    if not target_user:
        return False, "Invalid email or password. Please check your credentials or create an account.", None

    salt = target_user.get("salt", "")
    expected_hash = target_user.get("password_hash", "")
    computed_hash = _hash_password(password, salt)

    if not secrets.compare_digest(expected_hash, computed_hash):
        return False, "Invalid email or password. Please try again.", None

    profile = {
        "id": target_user.get("id"),
        "name": target_user.get("name", "User"),
        "email": target_user.get("email"),
        "role": target_user.get("role", "GENERAL"),
        "industry": target_user.get("industry", "general"),
        "token": f"apex_tok_{secrets.token_hex(18)}"
    }
    return True, "Authentication successful.", profile

def get_user_profile(email: str) -> dict[str, Any] | None:
    """Fetches user public profile by email."""
    if not email:
        return None
    users = _load_all_users()
    for u in users:
        if u.get("email", "").lower() == email.strip().lower():
            return {
                "id": u.get("id"),
                "name": u.get("name"),
                "email": u.get("email"),
                "role": u.get("role", "GENERAL"),
                "industry": u.get("industry", "general")
            }
    return None
