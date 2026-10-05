"""
APEX — Standalone Native Desktop Application
============================================
Launches APEX in its own dedicated, native desktop app window:
- Auto-starts server as a detached background process if not already running
- NO browser address bar
- NO browser tabs or bookmark bars
- Standalone window controls (Minimize, Maximize, Close)
"""
from __future__ import annotations
import os
import subprocess
import sys
import time
import urllib.request
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))


import http.client


def is_server_ready() -> bool:
    try:
        conn = http.client.HTTPConnection("127.0.0.1", 5000, timeout=0.6)
        conn.request("GET", "/api/health")
        resp = conn.getresponse()
        status = resp.status
        conn.close()
        return status == 200
    except Exception:
        return False


def start_server_if_needed():
    """Ensure the APEX server is running as an independent, detached background process."""
    if is_server_ready():
        return

    python_exe = os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    run_script = os.path.join(BASE_DIR, "run.py")

    # Launch detached process on Windows so it survives closing this app or Antigravity
    DETACHED_PROCESS = 0x00000008
    CREATE_NEW_PROCESS_GROUP = 0x00000200
    CREATE_NO_WINDOW = 0x08000000
    CREATE_BREAKAWAY_FROM_JOB = 0x01000000

    flags = DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW
    try:
        flags |= CREATE_BREAKAWAY_FROM_JOB
    except Exception:
        pass

    try:
        subprocess.Popen(
            [python_exe, run_script],
            cwd=BASE_DIR,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=flags,
            close_fds=True,
        )
    except Exception:
        # Fallback without breakaway if permission restricted
        subprocess.Popen(
            [python_exe, run_script],
            cwd=BASE_DIR,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP | CREATE_NO_WINDOW,
            close_fds=True,
        )

    for _ in range(30):
        time.sleep(0.3)
        if is_server_ready():
            break


def launch_edge_app_mode() -> bool:
    """
    Launch via Edge Native App Mode.
    Provides a 100% frameless standalone app experience with no URL bars or tabs.
    """
    edge_candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
    ]
    edge_path = next((p for p in edge_candidates if os.path.exists(p)), None)
    if not edge_path:
        return False

    profile_dir = os.path.join(BASE_DIR, "data", "app_profile")
    os.makedirs(profile_dir, exist_ok=True)

    args = [
        edge_path,
        "--app=http://127.0.0.1:5000",
        "--window-size=1360,900",
        f"--user-data-dir={profile_dir}",
        "--disable-extensions",
        "--disable-features=TranslateUI",
    ]
    subprocess.run(args)
    return True


def launch_pywebview() -> bool:
    """Launch via pywebview using Edge WebView2."""
    try:
        import webview
        icon_path = os.path.join(BASE_DIR, "frontend", "static", "apex_logo.ico")
        if not os.path.isfile(icon_path):
            icon_path = None

        window = webview.create_window(
            title="APEX — Universal Intelligence",
            url="http://127.0.0.1:5000",
            width=1360,
            height=900,
            resizable=True,
            min_size=(960, 640),
            background_color="#060912",
        )
        webview.start(debug=False)
        return True
    except Exception as e:
        return False


if __name__ == "__main__":
    start_server_if_needed()

    # Prefer Edge App Mode (ultra-clean, standalone native window) or pywebview
    if not launch_edge_app_mode():
        if not launch_pywebview():
            import webbrowser
            webbrowser.open("http://127.0.0.1:5000")
