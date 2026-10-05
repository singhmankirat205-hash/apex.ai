"""
APEX Self-Healing Cloudflare Tunnel Daemon.
Runs cloudflared.exe in a persistent watchdog thread.
Extracts public trycloudflare.com URL and keeps active_tunnel.json updated.
Ensures APEX is always available remotely on phones, laptops, and external devices.
"""
from __future__ import annotations

import atexit
import json
import logging
import os
import re
import socket
import subprocess
import threading
import time
from typing import Optional

logger = logging.getLogger("apex.tunnel_daemon")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TUNNEL_FILE = os.path.join(DATA_DIR, "active_tunnel.json")
LOG_FILE = os.path.join(DATA_DIR, "cloudflared.log")
EXE_PATH = os.path.join(BASE_DIR, "cloudflared.exe")

_process: Optional[subprocess.Popen] = None
_stop_event = threading.Event()
_watchdog_thread: Optional[threading.Thread] = None


def get_local_ip() -> str:
    """Find the real LAN IP address of this machine."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _write_tunnel_json(public_url: str, is_live: bool) -> None:
    """Atomically record active tunnel status for /api/share-info endpoint."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        local_ip = get_local_ip()
        data = {
            "public_url": public_url,
            "local_url": f"http://{local_ip}:5000",
            "is_tunnel_live": is_live,
            "updated_at": time.time()
        }
        with open(TUNNEL_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info("Tunnel metadata updated: %s (live=%s)", public_url, is_live)
    except Exception as e:
        logger.warning("Failed to write tunnel json: %s", e)


def _watchdog_loop() -> None:
    global _process
    if not os.path.exists(EXE_PATH):
        logger.warning("cloudflared.exe not found at %s. Public tunnel disabled.", EXE_PATH)
        return

    logger.info("Starting APEX Cloudflare Tunnel Watchdog...")

    while not _stop_event.is_set():
        cmd = [EXE_PATH, "tunnel", "--url", "http://127.0.0.1:5000", "--protocol", "http2"]
        os.makedirs(DATA_DIR, exist_ok=True)

        try:
            log_f = open(LOG_FILE, "a", encoding="utf-8", errors="ignore")
            _process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="ignore",
                bufsize=1
            )

            current_url = ""
            for line in iter(_process.stdout.readline, ""):
                if _stop_event.is_set():
                    break
                try:
                    log_f.write(line)
                    log_f.flush()
                except Exception:
                    pass

                m = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
                if m:
                    current_url = m.group(0)
                    _write_tunnel_json(current_url, True)
                    logger.info("APEX Public Tunnel active at: %s", current_url)

            if _process.stdout:
                _process.stdout.close()
            _process.wait()
            log_f.close()
        except Exception as e:
            logger.error("Cloudflared process error: %s", e)
            _write_tunnel_json("", False)

        if not _stop_event.is_set():
            logger.info("Tunnel process ended. Reconnecting in 3 seconds...")
            time.sleep(3)


def start_tunnel_daemon() -> None:
    """Launch the tunnel watchdog daemon in a background thread."""
    global _watchdog_thread
    if _watchdog_thread is not None and _watchdog_thread.is_alive():
        return
    _stop_event.clear()
    _watchdog_thread = threading.Thread(target=_watchdog_loop, name="CloudflareTunnelWatchdog", daemon=True)
    _watchdog_thread.start()


def stop_tunnel_daemon() -> None:
    """Cleanly terminate child tunnel process."""
    global _process
    _stop_event.set()
    if _process is not None:
        try:
            _process.terminate()
            _process.wait(timeout=2)
        except Exception:
            try:
                _process.kill()
            except Exception:
                pass


atexit.register(stop_tunnel_daemon)
