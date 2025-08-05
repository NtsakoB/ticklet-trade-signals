from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import os
from typing import Optional

router = APIRouter()

class TelegramMessage(BaseModel):
    text: str
    chat_id: Optional[str] = None
    channel: Optional[str] = "trading"  # "trading" or "maintenance"

@router.post("/send-signal")
def send_signal(message: TelegramMessage):
    """Send a trading signal to Telegram"""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Telegram bot token not configured")
    
    # Determine chat ID
    if message.chat_id:
        chat_id = message.chat_id
    elif message.channel == "maintenance":
        chat_id = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE")
    else:
        chat_id = os.getenv("TELEGRAM_CHAT_ID_TRADING")
    
    if not chat_id:
        raise HTTPException(status_code=500, detail=f"Chat ID not configured for channel: {message.channel}")
    
    # Send message
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message.text,
        "parse_mode": "Markdown"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return {
            "status": "sent",
            "code": response.status_code,
            "chat_id": chat_id,
            "message": "Signal sent successfully"
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send Telegram message: {str(e)}")

@router.get("/test")
def test_telegram():
    """Test Telegram bot connection"""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="Telegram bot token not configured")
    
    try:
        url = f"https://api.telegram.org/bot{token}/getMe"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        bot_info = response.json()
        return {
            "status": "connected",
            "bot_info": bot_info["result"],
            "message": "Telegram bot is operational"
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Telegram bot connection failed: {str(e)}")