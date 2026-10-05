#!/usr/bin/env python3
"""
APEX entry point.
Usage:
    python run.py
    uvicorn run:app --host 0.0.0.0 --port 5000 --reload
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

# Redirect stdout/stderr to data/server.log if running silently/windowless
_log_dir = os.path.join(BASE_DIR, "data")
os.makedirs(_log_dir, exist_ok=True)
_log_file = os.path.join(_log_dir, "server.log")

if sys.stdout is None:
    sys.stdout = open(_log_file, "a", encoding="utf-8", buffering=1)
if sys.stderr is None:
    sys.stderr = sys.stdout if sys.stdout is not None else open(os.devnull, "w")

from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, ".env"))   # loads .env before any imports use os.getenv

from backend.main import app  # noqa: E402
from backend.tunnel_daemon import start_tunnel_daemon

def prevent_windows_sleep():
    """Instruct Windows kernel to keep CPU and network active even when lid is closed or screen off."""
    if sys.platform == "win32":
        try:
            import ctypes
            ES_CONTINUOUS = 0x80000000
            ES_SYSTEM_REQUIRED = 0x00000001
            ES_AWAYMODE_REQUIRED = 0x00000040
            ctypes.windll.kernel32.SetThreadExecutionState(
                ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_AWAYMODE_REQUIRED
            )
        except Exception:
            pass

if __name__ == "__main__":
    prevent_windows_sleep()
    start_tunnel_daemon()
    import uvicorn
    uvicorn.run(
        "run:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
        reload=False,
        log_level="info",
    )
