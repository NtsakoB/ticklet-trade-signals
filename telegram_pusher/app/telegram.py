import httpx
from app.logger import setup_logger

logger = setup_logger()

async def send_text(token, chat_id, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 429:
            retry_after = resp.json().get("parameters", {}).get("retry_after", 1)
            logger.warning("Telegram rate-limited", retry_after=retry_after)
            raise Exception("Rate-limited", retry_after)
        resp.raise_for_status()
        data = resp.json()
        return data.get("result", {}).get("message_id")

async def send_photo(token, chat_id, photo_url, caption):
    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    payload = {"chat_id": chat_id, "photo": photo_url, "caption": caption}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload)
        if resp.status_code == 429:
            retry_after = resp.json().get("parameters", {}).get("retry_after", 1)
            logger.warning("Telegram rate-limited", retry_after=retry_after)
            raise Exception("Rate-limited", retry_after)
        resp.raise_for_status()
        data = resp.json()
        return data.get("result", {}).get("message_id")
