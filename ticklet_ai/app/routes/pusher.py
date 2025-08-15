from fastapi import APIRouter, Request, HTTPException
from typing import Any, Dict, Optional
import os, hmac, hashlib, json, time
import requests

router = APIRouter(tags=["pusher"])

# Env
SECRET = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET", "")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

CHAT_MAINT = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE", "")
CHAT_TRADES = os.getenv("TELEGRAM_CHAT_ID_TRADING", "")
CHAT_AI    = os.getenv("TELEGRAM_CHAT_ID_CHAT_BOT", "")

# Tunables (env or defaults)
HTTP_TIMEOUT = float(os.getenv("TELEGRAM_HTTP_TIMEOUT", "30"))
HTTP_RETRIES = int(os.getenv("TELEGRAM_HTTP_RETRIES", "2"))
HTTP_BACKOFF = float(os.getenv("TELEGRAM_HTTP_BACKOFF", "0.75"))
MAX_TEXT_LEN = int(os.getenv("TELEGRAM_MAX_TEXT_LEN", "4096"))

def _verify_signature(raw: bytes, provided: Optional[str]) -> None:
    if not SECRET:
        raise HTTPException(status_code=500, detail="Shared secret not configured")
    if not provided:
        raise HTTPException(status_code=401, detail="Missing signature")
    expected = hmac.new(SECRET.encode(), raw, hashlib.sha256).hexdigest()
    # constant-time comparison
    if not hmac.compare_digest(expected.lower(), provided.strip().lower()):
        raise HTTPException(status_code=403, detail="Invalid signature")

def _coerce_text(value: Any) -> str:
    """
    Accepts str | dict | list | None and returns a safe string <= MAX_TEXT_LEN.
    Fixes: AttributeError when 'text' is dict/list/None.
    """
    if isinstance(value, str):
        s = value.strip()
    elif isinstance(value, dict):
        # Try common keys first
        for k in ("message", "text", "content", "msg", "body"):
            v = value.get(k)
            if isinstance(v, str):
                s = v.strip()
                break
        else:
            s = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    elif isinstance(value, list):
        parts = [x for x in value if isinstance(x, str)]
        s = " ".join(parts).strip() if parts else json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    elif value is None:
        s = ""
    else:
        s = str(value).strip()
    if len(s) > MAX_TEXT_LEN:
        s = s[:MAX_TEXT_LEN - 3] + "..."
    return s

def _coerce_channel(value: Any) -> str:
    c = value if isinstance(value, str) else str(value or "maintenance")
    c = c.strip().lower()
    return c if c in {"maintenance", "trading", "chat"} else "maintenance"

def _coerce_image_url(value: Any) -> Optional[str]:
    if not value or not isinstance(value, str):
        return None
    v = value.strip()
    return v if (v.startswith("http://") or v.startswith("https://")) else None

def _dest_chat(channel: str) -> str:
    if channel == "trading":
        return CHAT_TRADES or CHAT_MAINT
    if channel == "chat":
        return CHAT_AI or CHAT_MAINT
    return CHAT_MAINT

def _telegram_post(endpoint: str, payload: Dict[str, Any]) -> requests.Response:
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Telegram bot token not set")
    url = f"https://api.telegram.org/bot{BOT_TOKEN}{endpoint}"
    last_exc: Optional[Exception] = None
    for attempt in range(HTTP_RETRIES + 1):
        try:
            return requests.post(url, json=payload, timeout=HTTP_TIMEOUT)
        except requests.RequestException as e:
            last_exc = e
            if attempt < HTTP_RETRIES:
                time.sleep(HTTP_BACKOFF * (attempt + 1))
            else:
                break
    raise HTTPException(status_code=502, detail=f"Telegram network error: {last_exc}")

def _send_telegram(text: str, channel: str = "maintenance", image_url: Optional[str] = None):
    chat_id = _dest_chat(channel)
    if not chat_id:
        raise HTTPException(status_code=500, detail="Telegram chat id not set")
    if image_url:
        r = _telegram_post("/sendPhoto", {"chat_id": chat_id, "photo": image_url, "caption": text})
    else:
        r = _telegram_post("/sendMessage", {"chat_id": chat_id, "text": text})
    if not r.ok:
        raise HTTPException(status_code=502, detail=f"Telegram error: {r.status_code} {r.text}")

@router.get("/health")
async def health():
    return {"ok": True}

@router.head("/health")
async def health_head():
    return {}

@router.post("/push")
async def push(request: Request):
    raw = await request.body()
    _verify_signature(raw, request.headers.get("X-Ticklet-Signature"))

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    text = _coerce_text(data.get("text"))
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")

    channel = _coerce_channel(data.get("channel"))
    image_url = _coerce_image_url(data.get("image_url"))

    _send_telegram(text=text, channel=channel, image_url=image_url)
    return {"ok": True}