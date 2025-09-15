import os, logging
from ticklet_ai.config import settings
TELEGRAM_ENABLED = str(settings.ENABLE_TELEGRAM).lower() == "true"
logger = logging.getLogger(__name__)

def send_telegram_message(channel: str, text: str, image_url: str | None = None) -> bool:
    if not TELEGRAM_ENABLED:
        logger.debug(f"[TG:NOOP] channel={channel} text={text[:80]!r}")
        return True
    try:
        # your real push here
        logger.info(f"[TG:SEND] {channel} len={len(text)} img={bool(image_url)}")
        return True
    except Exception as e:
        logger.warning(f"[TG:WARN] suppressed Telegram error: {e}")
        return False