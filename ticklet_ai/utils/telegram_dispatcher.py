import os
import time
import requests
import logging
from typing import Optional

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
formatter = logging.Formatter("[%(asctime)s] %(levelname)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)

# Rate limiting per chat
_last_sent_timestamps = {}

def send_telegram_message(chat_id: str, message: str, parse_mode: str = "Markdown", rate_limit_sec: int = 1) -> bool:
    """
    Sends a Telegram message to the specified chat ID while enforcing rate limiting.

    Args:
        chat_id (str): The Telegram chat ID to send the message to.
        message (str): The message content to send.
        parse_mode (str): The parse mode for the message (e.g., "Markdown", "HTML").
        rate_limit_sec (int): Minimum time (in seconds) between consecutive messages to the same chat.

    Returns:
        bool: True if the message was sent successfully, False otherwise.

    Raises:
        EnvironmentError: If the TELEGRAM_TOKEN environment variable is not set.
    """
    token = os.getenv("TELEGRAM_TOKEN")
    if not token:
        raise EnvironmentError("TELEGRAM_TOKEN is not set in the environment.")

    # Enforce rate limiting
    now = time.time()
    last_sent = _last_sent_timestamps.get(chat_id, 0)
    if now - last_sent < rate_limit_sec:
        logger.warning(f"Rate limit active for chat {chat_id}. Skipping message.")
        return False
    _last_sent_timestamps[chat_id] = now

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }

    try:
        response = requests.post(url, data=data)
        if response.status_code != 200:
            logger.error(f"Telegram API error: {response.text}")
            return False
        logger.info(f"Message sent successfully to chat {chat_id}.")
        return True
    except requests.RequestException as e:
        logger.exception(f"Failed to send Telegram message due to a network error: {e}")
        return False
    except Exception as e:
        logger.exception(f"Unexpected error while sending Telegram message: {e}")
        return False


def get_target_channel(type: str = "trading") -> Optional[str]:
    """
    Determines the target Telegram channel based on the type of notification.

    Args:
        type (str): The type of notification ("trading" or "maintenance").

    Returns:
        Optional[str]: The chat ID of the target channel, or None if not set.
    """
    if type == "maintenance":
        chat_id = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE")
    else:
        chat_id = os.getenv("TELEGRAM_CHAT_ID_TRADING")

    if not chat_id:
        logger.warning(f"No chat ID found for notification type: {type}")
    return chat_id