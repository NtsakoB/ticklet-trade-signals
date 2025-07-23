from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from feedback_and_failover import send_daily_summary
import pytz
import signal
import logging
import os

# Setup logging
logging.basicConfig(level=logging.INFO)

# Scheduler configuration
scheduler = BackgroundScheduler(timezone="Africa/Johannesburg")

# Dynamic time configuration
HOUR = int(os.getenv("SCHEDULER_HOUR", 19))
MINUTE = int(os.getenv("SCHEDULER_MINUTE", 0))

def schedule_tasks():
    """
    Schedules the daily summary task at a specified time.
    """
    try:
        scheduler.add_job(send_daily_summary, 'cron', hour=HOUR, minute=MINUTE)
        logging.info(f"[{datetime.now()}] Scheduled daily summary task at {HOUR}:{MINUTE}.")
        scheduler.start()
    except Exception as e:
        logging.error(f"[{datetime.now()}] Error starting scheduler: {str(e)}")

def graceful_shutdown(signum, frame):
    """
    Shuts down the scheduler gracefully on application exit.
    """
    print(f"[{datetime.now()}] Shutting down scheduler...")
    logging.info(f"[{datetime.now()}] Shutting down scheduler...")
    scheduler.shutdown()

if __name__ == "__main__":
    signal.signal(signal.SIGINT, graceful_shutdown)
    signal.signal(signal.SIGTERM, graceful_shutdown)
    
    print(f"[{datetime.now()}] Starting scheduler...")
    logging.info(f"[{datetime.now()}] Starting scheduler...")
    schedule_tasks()