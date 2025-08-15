from typing import Dict, Any, Optional
import os, time, json, hmac, hashlib, asyncio
import requests

RAW_PUSHER = (os.getenv("TELEGRAM_PUSHER_URL", "") or "").rstrip("/")
SECRET     = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET", "")

TIMEOUT = float(os.getenv("PUSHER_HTTP_TIMEOUT", "30"))
RETRIES = int(os.getenv("PUSHER_HTTP_RETRIES", "2"))
BACKOFF = float(os.getenv("PUSHER_HTTP_BACKOFF", "0.75"))
PREVIEW = os.getenv("PREVIEW_MODE", "false").lower() == "true"

# Accept either full /push URL or base URL
PUSHER_URL = RAW_PUSHER if RAW_PUSHER.endswith("/push") else (RAW_PUSHER + "/push" if RAW_PUSHER else "")

def _headers(body: str) -> Dict[str, str]:
    ts = str(int(time.time()))
    idem = f"ticklet-{ts}"
    sig = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Ticklet-Timestamp": ts,
        "X-Idempotency-Key": idem,
        "X-Ticklet-Signature": sig,
    }

def _post_sync(obj: Dict[str, Any]) -> Dict[str, Any]:
    if PREVIEW:
        return {"ok": True, "preview": True, "payload": obj}
    if not PUSHER_URL:
        raise RuntimeError("TELEGRAM_PUSHER_URL not set")
    if not SECRET:
        raise RuntimeError("TELEGRAM_PUSHER_SHARED_SECRET not set")

    body = json.dumps(obj, separators=(",", ":"), ensure_ascii=False)
    last_exc: Optional[Exception] = None
    for attempt in range(RETRIES + 1):
        try:
            r = requests.post(PUSHER_URL, headers=_headers(body), data=body, timeout=TIMEOUT)
            if 500 <= r.status_code < 600 and attempt < RETRIES:
                time.sleep(BACKOFF * (attempt + 1)); continue
            r.raise_for_status()
            return r.json() if r.headers.get("content-type","").startswith("application/json") else {"ok": r.ok}
        except requests.RequestException as e:
            last_exc = e
            if attempt < RETRIES:
                time.sleep(BACKOFF * (attempt + 1))
            else:
                break
    raise RuntimeError(f"Pusher request failed: {last_exc}")

async def send_trade(payload: Dict[str, Any]) -> Dict[str, Any]:
    obj = {"channel": "trading", **(payload or {})}
    return await asyncio.to_thread(_post_sync, obj)

async def send_maint(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Ensure text always serializes even if structured
    if isinstance(payload, dict) and not isinstance(payload.get("text"), str):
        payload = {"text": json.dumps(payload, ensure_ascii=False)[:512], **payload}
    obj = {"channel": "maintenance", **(payload or {})}
    return await asyncio.to_thread(_post_sync, obj)