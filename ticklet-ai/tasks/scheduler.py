# 📁 LOCATION: /backend/tasks/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from utils.telegram_dispatcher import send_telegram_message, get_target_channel
import logging
import datetime
import requests

logger = logging.getLogger(__name__)

def get_mock_accuracy_summary():
    """
    Placeholder simulating accuracy summary from /accuracy_snapshots/summary.
    """
    return {
        "Ticklet Alpha": "74.3%",
        "Growth": "58.6%",
        "Performance": "62.1%"
    }

def send_daily_ai_report():
    """
    Generates and sends a simulated AI report.
    Sends full version to Technician and summary to Trading.
    Logs to Supabase on failure.
    """
    try:
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        accuracy_data = get_mock_accuracy_summary()

        full_report = f"""📊 AI Daily Report — {today}

✅ Top Strategy: Ticklet Alpha
📉 Lowest Accuracy: Growth
📈 Best Performing Symbol: XRPUSDT
⚠️ Common Mistake: RSI overbought re-entry too early
🧠 ML Insight: Consider tightening SL on volatile pairs

🔢 Accuracy Metrics:
- Ticklet Alpha: {accuracy_data['Ticklet Alpha']}
- Growth: {accuracy_data['Growth']}
- Performance: {accuracy_data['Performance']}

— End of Report —
"""

        summary = f"""📣 *Daily AI Summary* — {today}

🏆 Best: Ticklet Alpha  
📉 Worst: Growth  
📊 Avg Accuracy: 65.0%  
🧠 Tip: Avoid overbought RSI re-entries on low volume

View full report in Ticklet Technician ✅
"""

        # Send to Technician channel
        tech_success = send_telegram_message(get_target_channel("maintenance"), full_report)

        # Send summary to Trading group
        trade_success = send_telegram_message(get_target_channel("trading"), summary)

        # Failover logging
        if not tech_success or not trade_success:
            log_supabase_failure(
                component="AI Scheduler",
                detail="Failed to send report",
                meta={"tech_success": tech_success, "trade_success": trade_success}
            )

        logger.info("📤 Daily AI report dispatched.")
    
    except Exception as e:
        logger.error(f"❌ Report scheduler failed: {e}")
        log_supabase_failure(
            component="AI Scheduler",
            detail="Exception during report send",
            meta={"error": str(e)}
        )

def log_supabase_failure(component: str, detail: str, meta: dict):
    """
    Sends a log entry to Supabase fallback endpoint.
    """
    try:
        requests.post("https://gjtetfgujpcyhjenudnb.supabase.co/rest/v1/report_failures", 
                     json={
                         "timestamp": datetime.datetime.utcnow().isoformat(),
                         "component": component,
                         "detail": detail,
                         "meta": meta
                     },
                     headers={
                         "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqdGV0Zmd1anBjeWhqZW51ZG5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzQ5NjQsImV4cCI6MjA2NzcxMDk2NH0.RJddAD-2oCXMFaNCjBFMjqqGiwn21tfU3x8Kxgm9Y3s",
                         "Content-Type": "application/json"
                     })
        logger.warning("⚠️ Logged failure to Supabase.")
    except Exception as e:
        logger.error(f"❌ Failed to log to Supabase: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Africa/Johannesburg")
    scheduler.add_job(
        send_daily_ai_report,
        CronTrigger(hour=10, minute=0),
        id="daily_ai_report_job",
        name="Daily AI Report to Telegram Technician",
        replace_existing=True
    )
    scheduler.start()
    logger.info("⏰ Scheduler started: Daily AI Report at 10:00")