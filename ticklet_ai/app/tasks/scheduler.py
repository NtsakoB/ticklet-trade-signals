import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from ticklet_ai.config import settings
from ticklet_ai.core.pipeline import scan_and_send_signals
from ticklet_ai.core.training import train_model_if_due

logger = logging.getLogger(__name__)

def heartbeat():
    logger.info("HEARTBEAT: worker alive")

def start_scheduler():
    scheduler = BackgroundScheduler(timezone=settings.TZ)
    logger.info("SCHEDULER: wiring jobs…")
    scheduler.add_job(scan_and_send_signals, CronTrigger.from_crontab(settings.SCAN_INTERVAL_CRON), id="scan")
    scheduler.add_job(heartbeat, CronTrigger.from_crontab("*/10 * * * *"), id="beat")
    scheduler.add_job(train_model_if_due, CronTrigger.from_crontab(settings.TRAINING_CRON), id="train")
    scheduler.start()
    logger.info("SCHEDULER: started (scan=%s, train=%s, beat=*/10)", settings.SCAN_INTERVAL_CRON, settings.TRAINING_CRON)