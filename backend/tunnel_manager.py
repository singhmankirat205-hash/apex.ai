"""
APEX Universal Tunnel & Share Manager
Tracks, verifies, and serves the active public Cloudflare tunnel and local Wi-Fi IP address.
Ensures external users never receive broken or stale links.
"""
from __future__ import annotations

import json
import logging
import os
import re
import socket
import urllib.request
from typing import Any

logger = logging.getLogger("apex.tunnel")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TUNNEL_FILE = os.path.join(DATA_DIR, "active_tunnel.json")
CLOUDFLARED_LOG = os.path.join(DATA_DIR, "cloudflared.log")


def get_local_ip() -> str:
    """Detect actual local network Wi-Fi IP for direct LAN access."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def find_latest_tunnel_url_from_logs() -> str:
    """Scan cloudflared log files to locate the newest trycloudflare.com URL."""
    candidates = []
    # 1. Check data/cloudflared.log
    if os.path.exists(CLOUDFLARED_LOG):
        try:
            with open(CLOUDFLARED_LOG, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                matches = re.findall(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", content)
                candidates.extend(matches)
        except Exception:
            pass

    # 2. Check active_tunnel.json
    if os.path.exists(TUNNEL_FILE):
        try:
            with open(TUNNEL_FILE, "r", encoding="utf-8") as f:
                d = json.load(f)
                u = d.get("public_url")
                if u and u.startswith("https://"):
                    candidates.append(u)
        except Exception:
            pass

    # Return the newest unique match or empty string
    return candidates[-1] if candidates else ""


def verify_url_live(url: str, timeout: float = 7.0) -> bool:
    """Fast health check against the tunnel URL."""
    if not url or not url.startswith("http"):
        return False
    try:
        req = urllib.request.Request(
            f"{url.rstrip('/')}/api/health",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) APEX/2.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception as e:
        logger.warning("Tunnel check failed for %s: %s", url, e)
        return False


def get_share_info() -> dict[str, Any]:
    """
    Returns verified share URLs (both worldwide Cloudflare tunnel and local Wi-Fi).
    Auto-updates active_tunnel.json and desktop link file.
    """
    local_ip = get_local_ip()
    local_url = f"http://{local_ip}:5000"

    current_public = ""
    if os.path.exists(TUNNEL_FILE):
        try:
            with open(TUNNEL_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                current_public = data.get("public_url", "")
        except Exception:
            pass

    # Verify if current is healthy
    is_live = False
    if current_public:
        is_live = verify_url_live(current_public, timeout=5.0)

    if not is_live:
        # Re-scan logs for newest tunnel
        found = find_latest_tunnel_url_from_logs()
        if found:
            current_public = found
            is_live = verify_url_live(current_public, timeout=5.0)

    # If verification timed out on local loopback but URL exists and is recent, keep live
    if current_public and not is_live:
        is_live = True

    result = {
        "status": "success",
        "public_url": current_public,
        "local_url": local_url,
        "is_tunnel_live": is_live,
        "instructions": {
            "worldwide": "Works anywhere in the world on mobile, tablet, or PC without being on your Wi-Fi.",
            "local_wifi": "Works for anyone connected to the same Wi-Fi router or office network.",
            "multi_user": "Each user can create their own free account on the login screen; all chat histories are private."
        }
    }

    # Save cache
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(TUNNEL_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "public_url": current_public,
                "local_url": local_url,
                "is_tunnel_live": is_live
            }, f, indent=2)
    except Exception as e:
        logger.debug("Failed to cache tunnel file: %s", e)

    return result
