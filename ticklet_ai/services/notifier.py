import os, time, uuid, hmac, hashlib, json, requests

PUSHER_URL = os.getenv("TELEGRAM_PUSHER_URL")
SECRET = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET")

def send_telegram(channel: str, text: str, image_url: str | None = None):
    assert PUSHER_URL and SECRET, "Pusher env not set"
    body = {"channel": channel, "text": text}
    if image_url: 
        body["image_url"] = image_url
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