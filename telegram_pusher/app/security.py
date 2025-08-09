import hmac
import hashlib
import time
from fastapi import Request, HTTPException
from app.storage.idem import IdempotencyStore

def verify_signature(secret, raw_body, signature):
    h = hmac.new(secret.encode(), raw_body, hashlib.sha256)
    expected = h.hexdigest()
    return hmac.compare_digest(expected, signature)

def verify_timestamp(ts, max_skew=300):
    now = int(time.time())
    return abs(now - int(ts)) <= max_skew

store = IdempotencyStore(ttl_days=int(7))

async def require_auth(request: Request, raw_body: bytes, shared_secret: str):
    sig = request.headers.get("X-Ticklet-Signature")
    ts = request.headers.get("X-Ticklet-Timestamp")
    if not sig or not ts:
        raise HTTPException(status_code=401, detail="Missing HMAC or timestamp")
    if not verify_signature(shared_secret, raw_body, sig):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")
    if not verify_timestamp(ts):
        raise HTTPException(status_code=401, detail="Timestamp too old")

def idempotent(key, value=None):
    previous = store.get(key)
    if previous:
        return previous
    if value is not None:
        store.set(key, value)
    return None
