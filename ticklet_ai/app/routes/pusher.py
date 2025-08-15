from fastapi import APIRouter, Request, HTTPException
import os, hmac, hashlib, requests

router = APIRouter(tags=["pusher"])

SECRET = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET", "")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

CHAT_MAINT = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE", "")
CHAT_TRADES = os.getenv("TELEGRAM_CHAT_ID_TRADING", "")
CHAT_AI    = os.getenv("TELEGRAM_CHAT_ID_CHAT_BOT", "")

def _verify_signature(raw: bytes, provided: str | None) -> None:
    if not SECRET:
        raise HTTPException(status_code=500, detail="Shared secret not configured")
    if not provided:
        raise HTTPException(status_code=401, detail="Missing signature")
    expected = hmac.new(SECRET.encode(), raw, hashlib.sha256).hexdigest()
    if expected.lower() != provided.strip().lower():
        raise HTTPException(status_code=403, detail="Invalid signature")

def _chat_for(channel: str) -> str:
    c = (channel or "maintenance").lower()
    if c == "trading":
        return CHAT_TRADES or CHAT_MAINT
    if c == "chat":
        return CHAT_AI or CHAT_MAINT
    return CHAT_MAINT

def _send_telegram(text: str, channel: str = "maintenance", image_url: str | None = None):
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="Telegram bot token not set")
    chat = _chat_for(channel)
    if not chat:
        raise HTTPException(status_code=500, detail="Telegram chat id not set")

    base = f"https://api.telegram.org/bot{BOT_TOKEN}"
    try:
        if image_url:
            r = requests.post(
                f"{base}/sendPhoto",
                json={"chat_id": chat, "photo": image_url, "caption": text},
                timeout=12,
            )
        else:
            r = requests.post(
                f"{base}/sendMessage",
                json={"chat_id": chat, "text": text},
                timeout=12,
            )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Telegram network error: {e}")

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
    sig = request.headers.get("X-Ticklet-Signature")
    _verify_signature(raw, sig)

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    text = (data.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing text")

    channel = (data.get("channel") or "maintenance").strip()
    image_url = data.get("image_url")

    _send_telegram(text=text, channel=channel, image_url=image_url)
    return {"ok": True}