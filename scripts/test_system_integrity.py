import os
import requests
import openai
from supabase import create_client, Client

# Load environment variables
API_URL                = os.getenv("BACKEND_URL")
OPENAI_KEY             = os.getenv("TICKLET_OPENAI_KEY")
SUPABASE_URL           = os.getenv("TICKLET_SUPABASE_URL")
SUPABASE_KEY           = os.getenv("TICKLET_SUPABASE_ANON_KEY")
TELEGRAM_TOKEN         = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID_TRADING        = os.getenv("TELEGRAM_CHAT_ID_TRADING")
CHAT_ID_MAINTENANCE    = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE")

def check_backend():
    print("🔹 Checking FastAPI `/` endpoint...")
    try:
        r = requests.get(f"{API_URL}/")
        r.raise_for_status()
        print("✅ FastAPI backend is running.")
    except Exception as e:
        print(f"❌ Backend check failed: {e}")
        raise

def check_openai():
    print("🔹 Checking OpenAI API...")
    try:
        openai.api_key = OPENAI_KEY
        models = openai.models.list()
        print("✅ OpenAI key is valid.")
    except Exception as e:
        print(f"❌ OpenAI check failed: {e}")
        raise

def check_supabase():
    print("🔹 Checking Supabase connection...")
    try:
        client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        data = client.table("chat_logs").select("*").limit(1).execute()
        print("✅ Supabase connection successful.")
    except Exception as e:
        print(f"❌ Supabase check failed: {e}")
        raise

def send_telegram_test():
    print("🔹 Sending test messages to Telegram...")
    try:
        for chat_id in [CHAT_ID_TRADING, CHAT_ID_MAINTENANCE]:
            msg = f"✅ Ticklet AI System Test Success for {chat_id}"
            url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
            r = requests.post(url, json={"chat_id": chat_id, "text": msg})
            r.raise_for_status()
        print("✅ Telegram messages sent successfully.")
    except Exception as e:
        print(f"❌ Telegram check failed: {e}")
        raise

def run_all():
    print("\n🧠 TICKLET AI SYSTEM DIAGNOSTIC\n===================================")
    try:
        check_backend()
        check_openai()
        check_supabase()
        send_telegram_test()
        print("\n🎉 ALL SYSTEMS GO — Ticklet AI is live and fully operational!\n")
    except Exception as e:
        print("\n🚨 SYSTEM ERROR DETECTED:")
        print(f"   → {e}\n")

if __name__ == "__main__":
    run_all()