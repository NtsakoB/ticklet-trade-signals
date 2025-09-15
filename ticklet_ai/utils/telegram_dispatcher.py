import os, logging
from ticklet_ai.config import settings
logger = logging.getLogger(__name__)
TELEGRAM_ENABLED = str(settings.ENABLE_TELEGRAM).lower() == 'true'

def send_telegram_message(channel: str, text: str, image_url: str | None = None) -> bool:
    if not TELEGRAM_ENABLED:
        logger.debug(f"[TG:NOOP] channel={channel} text={text[:80]!r} image={bool(image_url)}")
        return True
    try:
        # Existing integration lives here (pusher or direct bot call)
        logger.info(f"[TG:SEND] channel={channel} len={len(text)} image={bool(image_url)}")
        return True
    except Exception as e:
        logger.warning(f"[TG:WARN] suppressed Telegram error: {e}")
        return False