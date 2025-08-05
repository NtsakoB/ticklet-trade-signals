import requests
import os
import openai
from supabase import create_client

# Load environment variables
API_URL = os.getenv("BACKEND_URL", "https://your-app.onrender.com")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID_SIGNALS = os.getenv("TELEGRAM_CHAT_ID_SIGNALS")
CHAT_ID_MAINTENANCE = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE")

def log(msg):
    print(f"🔹 {msg}")

def check_backend_root():
    log("Checking FastAPI `/` endpoint...")
    res = requests.get(f"{API_URL}/")
    res.raise_for_status()
    log("✅ FastAPI backend is up and responding.")

def check_openai():
    log("Checking OpenAI key...")
    openai.api_key = OPENAI_KEY
    models = openai.models.list()
    assert len(models.data) > 0
    log("✅ OpenAI key is valid and models are available.")

def check_supabase():
    log("Checking Supabase connection...")
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    response = client.table("chat_logs").select("*").limit(1).execute()
    assert response.status_code == 200
    log("✅ Supabase connection is working.")

def check_telegram_bot():
    log("Checking Telegram bot identity...")
    res = requests.get(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getMe")
    res.raise_for_status()
    log("✅ Telegram bot is live and authenticated.")

def send_telegram_message(chat_id, message):
    log(f"Sending Telegram test message to {chat_id}...")
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}
    res = requests.post(url, json=payload)
    res.raise_for_status()
    log(f"✅ Message sent to {chat_id}")

def optional_endpoint_check(endpoint):
    log(f"Checking `{endpoint}` endpoint...")
    res = requests.get(f"{API_URL}{endpoint}")
    res.raise_for_status()
    log(f"✅ `{endpoint}` responded with {res.status_code}")

def run_full_check():
    print("\n🧠 TICKLET AI SYSTEM DIAGNOSTIC\n" + "="*35)
    try:
        check_backend_root()
        check_openai()
        check_supabase()
        check_telegram_bot()
        send_telegram_message(CHAT_ID_SIGNALS, "✅ Ticklet AI Diagnostic: Signals channel is live.")
        send_telegram_message(CHAT_ID_MAINTENANCE, "✅ Ticklet AI Diagnostic: Maintenance channel is online.")
        
        # Optional health checks for AI endpoints
        optional_endpoint_check("/chat")
        optional_endpoint_check("/generate-signal")
        optional_endpoint_check("/ping/bybit")

        print("\n🎉 ALL SYSTEMS GO — Ticklet AI is live and operational.")
    except Exception as e:
        print("\n❌ SYSTEM ERROR DETECTED:")
        print(f"   → {str(e)}")

if __name__ == "__main__":
    run_full_check()