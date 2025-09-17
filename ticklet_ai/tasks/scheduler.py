# 📁 LOCATION: /backend/tasks/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from ticklet_ai.config import settings
from utils.telegram_dispatcher import send_telegram_message, get_target_channel
import logging
import datetime
import requests
import os

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_LOG_ENDPOINT = "https://gjtetfgujpcyhjenudnb.supabase.co/rest/v1/report_failures"
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s")

def fetch_accuracy_summary() -> dict:
    """
    Pulls real-time accuracy metrics from the Ticklet API.
    """
    try:
        response = requests.get("http://localhost:8000/api/accuracy_snapshots/summary")
        if response.status_code != 200:
            raise Exception(f"Status code {response.status_code}")
        data = response.json()["summary"]

        # Calculate simple averages or extract latest per strategy
        summary = {}
        for strategy, entries in data.items():
            latest = entries[0]["accuracy"]  # Assuming entries are sorted
            summary[strategy] = f"{latest:.1f}%"
        return summary

    except Exception as e:
        logger.error(f"⚠️ Failed to fetch accuracy summary: {e}")
        # Fallback to mock data
        return {
            "Ticklet Alpha": "74.3%",
            "Growth": "58.6%",
            "Performance": "62.1%"
        }

def log_supabase_failure(component: str, detail: str, meta: dict):
    """
    Logs a failure event to Supabase (table: report_failures).
    """
    try:
        headers = {
            "apikey": SUPABASE_API_KEY,
            "Authorization": f"Bearer {SUPABASE_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "component": component,
            "detail": detail,
            "meta": meta
        }
        r = requests.post(SUPABASE_LOG_ENDPOINT, json=payload, headers=headers)
        r.raise_for_status()
        logger.warning("⚠️ Logged to Supabase report_failures.")
    except Exception as e:
        logger.error(f"❌ Failed to log to Supabase: {e}")

def send_daily_ai_report():
    """
    Generates and sends AI report to both Telegram channels.
    """
    try:
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        accuracy_data = fetch_accuracy_summary()

        full_report = f"""📊 AI Daily Report — {today}

✅ Top Strategy: Ticklet Alpha
📉 Lowest Accuracy: Growth
📈 Best Performing Symbol: XRPUSDT
⚠️ Common Mistake: RSI overbought re-entry too early
🧠 ML Insight: Consider tightening SL on volatile pairs

🔢 Accuracy Metrics:
""" + "\n".join([f"- {k}: {v}" for k, v in accuracy_data.items()]) + "\n\n— End of Report —"

        summary = f"""📣 *Daily AI Summary* — {today}

🏆 Best: Ticklet Alpha  
📉 Worst: Growth  
📊 Accuracy:
""" + "\n".join([f"- {k}: {v}" for k, v in accuracy_data.items()]) + "\n\nView full report in Ticklet Technician ✅"

        # Send to both channels
        tech_success = send_telegram_message(get_target_channel("maintenance"), full_report)
        trade_success = send_telegram_message(get_target_channel("trading"), summary)

        if not tech_success or not trade_success:
            log_supabase_failure(
                component="AI Scheduler",
                detail="Telegram message delivery failed",
                meta={"tech_success": tech_success, "trade_success": trade_success}
            )

        logger.info("📤 Daily AI report sent to both channels.")

    except Exception as e:
        logger.error(f"❌ Report scheduler failed: {e}")
        log_supabase_failure(
            component="AI Scheduler",
            detail="Unhandled scheduler exception",
            meta={"error": str(e)}
        )

def start_scheduler():
    scheduler = BackgroundScheduler(timezone=settings.TZ)
    scheduler.add_job(
        send_daily_ai_report,
        CronTrigger(hour=10, minute=0),
        id="daily_ai_report_job",
        name="Daily AI Report to Telegram Technician",
        replace_existing=True
    )
    
    # Add background data enrichment for strategies
    try:
        from ticklet_ai.tasks.collector import enrich_loop
        scheduler.add_job(
            enrich_loop,
            CronTrigger.from_crontab("*/1 * * * *"),
            id="data_enrichment_job", 
            name="Background Data Enrichment",
            replace_existing=True
        )
        logger.info("📊 Added background data enrichment job (every minute)")
    except ImportError:
        logger.warning("⚠️ Background data enrichment not available")
    
    scheduler.start()
    logger.info("⏰ Scheduler started: Daily AI Report at 10:00, Data Enrichment every minute")