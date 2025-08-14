import os, time, uuid, hmac, hashlib, json, requests

PUSHER_URL = os.getenv("TELEGRAM_PUSHER_URL")
SECRET     = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET")
TRADING_CH = os.getenv("TELEGRAM_CHAT_ID_TRADING")
MAINT_CH   = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE", TRADING_CH)

def _post(body):
    raw = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
    sig = hmac.new(SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()
    headers = {
      "Content-Type": "application/json",
      "X-Ticklet-Timestamp": str(int(time.time())),
      "X-Idempotency-Key": str(uuid.uuid4()),
      "X-Ticklet-Signature": sig,
    }
    r = requests.post(PUSHER_URL, headers=headers, data=raw, timeout=10)
    r.raise_for_status()

def send_trade(text: str, image_url: str | None = None):
    _post({"channel": TRADING_CH, "text": text, "image_url": image_url})

def send_maint(text: str):
    _post({"channel": MAINT_CH, "text": text})