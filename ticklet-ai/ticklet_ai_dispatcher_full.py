import os
import logging
import asyncio
from telethon import TelegramClient
from dotenv import load_dotenv
from feedback_and_failover import send_gpt_response

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)

# Telegram credentials from environment variables
api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
chat_id = os.getenv("TELEGRAM_CHAT_ID")

if not all([api_id, api_hash, bot_token, chat_id]):
    raise ValueError("One or more required environment variables are missing.")

# Initialize Telegram client
client = TelegramClient('ticklet_dispatch', api_id, api_hash).start(bot_token=bot_token)

async def mirror_message_to_telegram(prompt, response):
    """
    Sends a prompt and its corresponding response to a Telegram chat.
    """
    try:
        message = f"📤 Prompt: {prompt}\n📥 Response: {response}"
        await asyncio.wait_for(client.send_message(chat_id, message), timeout=10)
        logging.info(f"Message sent to Telegram: {message}")
    except asyncio.TimeoutError:
        logging.error("Timeout occurred while sending message to Telegram.")
    except Exception as e:
        logging.error(f"Error sending message to Telegram: {str(e)}")

def dispatch_daily_ai_summary():
    """
    Dispatches a daily AI-generated summary to Telegram.
    """
    try:
        summary = send_gpt_response("Give me today's crypto market summary and a short trading lesson.")
        client.loop.run_until_complete(mirror_message_to_telegram("Daily Summary", summary))
        logging.info("Daily summary dispatched successfully.")
    except Exception as e:
        logging.error(f"Error dispatching AI summary: {str(e)}")