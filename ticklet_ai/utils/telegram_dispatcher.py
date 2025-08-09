import os
import time
import json
import hmac
import uuid
import hashlib
import logging
from typing import Optional

import requests

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# Backoff schedule (seconds)
_BACKOFF = [0.5, 1.0, 2.0, 4.0]


def _sign(secret: str, raw_body: bytes) -> str:
    return hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()


def send_telegram_message(channel: str, message: str, *, image_url: Optional[str] = None) -> bool:
    """
    Notifier entrypoint. Sends a Telegram alert via the external telegram_pusher service.

    Behavior per spec:
      - POST to TELEGRAM_PUSHER_URL with HMAC headers
      - 200-299: success -> True
      - 409 (idempotent): log & treat as success -> True
      - 503 (circuit breaker): log & return False so caller can queue retry
      - Other 5xx: retry with exponential backoff, then False if still failing
      - 4xx: log & return False
    """
    pusher_url = os.getenv("TELEGRAM_PUSHER_URL")
    shared_secret = os.getenv("TICKLET_SHARED_SECRET")

    if not pusher_url:
        logger.error("TELEGRAM_PUSHER_URL is not set; cannot dispatch Telegram alerts.")
        return False
    if not shared_secret:
        logger.error("TICKLET_SHARED_SECRET is not set; cannot sign push requests.")
        return False

    payload = {
        "channel": "signals" if channel in {"trading", "signals"} else "maintenance",
        "text": message,
    }
    if image_url:
        payload["image_url"] = image_url

    raw_body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    timestamp = str(int(time.time()))
    signature = _sign(shared_secret, raw_body)
    headers = {
        "Content-Type": "application/json",
        "X-Ticklet-Signature": signature,
        "X-Ticklet-Timestamp": timestamp,
        "X-Idempotency-Key": str(uuid.uuid4()),
    }

    # Try once, then backoff on 5xx (except 503 which we return immediately)
    url = pusher_url.rstrip("/") + "/push"

    try:
        resp = requests.post(url, data=raw_body, headers=headers, timeout=10)
    except requests.RequestException as e:
        logger.warning(f"Initial push attempt failed: {e}")
        resp = None

    def _handle_response(r: Optional[requests.Response]) -> Optional[bool]:
        if r is None:
            return None
        status = r.status_code
        if 200 <= status < 300:
            logger.info("Telegram push dispatched via pusher", extra={"status": status})
            return True
        if status == 409:
            logger.info("Idempotent push detected (409) — skipping retry")
            return True
        if status == 503:
            logger.warning("Pusher circuit breaker open (503) — queue for retry")
            return False
        if 500 <= status < 600:
            # Instruct caller to attempt retries (we will do some here too)
            return None
        # 4xx non-409
        try:
            body = r.text
        except Exception:
            body = "<no body>"
        logger.error(f"Pusher returned {status}: {body}")
        return False

    result = _handle_response(resp)
    if result is not None:
        return result

    # Backoff retries for generic 5xx or initial network failure
    for delay in _BACKOFF:
        time.sleep(delay)
        try:
            resp = requests.post(url, data=raw_body, headers=headers, timeout=10)
        except requests.RequestException as e:
            logger.warning(f"Retry failed after {delay}s: {e}")
            resp = None
        result = _handle_response(resp)
        if result is not None:
            return result

    logger.error("Exhausted retries sending to telegram_pusher")
    return False


def get_target_channel(type: str = "trading") -> Optional[str]:
    """
    Maps legacy notifier 'type' to telegram_pusher channel names.
      - "trading"  -> "signals"
      - "maintenance" -> "maintenance"
    Returns the channel name expected by the pusher.
    """
    if type == "maintenance":
        return "maintenance"
    return "signals"
