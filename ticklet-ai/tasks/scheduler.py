# 📁 LOCATION: /backend/tasks/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

from utils.telegram_dispatcher import send_telegram_message, get_target_channel
from routers.ai_report import generate_mock_report

logger = logging.getLogger(__name__)

def send_daily_ai_report():
    """
    Generates the daily AI report and sends it to the technician channel.
    """
    try:
        report = generate_mock_report()
        send_telegram_message(get_target_channel("maintenance"), f"📄 *Daily AI Report*\n\n{report}")
        logger.info("✅ AI report sent to technician channel.")
    except Exception as e:
        logger.error(f"❌ Failed to send AI report: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler(timezone="Africa/Johannesburg")

    # 7:00 PM every day
    scheduler.add_job(
        send_daily_ai_report,
        CronTrigger(hour=19, minute=0),
        id="daily_ai_report_job",
        name="Daily AI Report to Telegram Technician",
        replace_existing=True
    )

    scheduler.start()
    logger.info("⏰ Scheduler started: Daily AI Report at 19:00")