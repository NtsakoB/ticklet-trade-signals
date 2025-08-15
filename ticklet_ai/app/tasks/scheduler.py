import asyncio
import inspect
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

# Adjust import path as in your project
from ticklet_ai.app.services.scanner import get_candidates
from ticklet_ai.services.notifier import send_maint

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def _scan_once():
    """
    One scan tick. Robust to sync or async get_candidates().
    If get_candidates() returns a list, we use it directly.
    If it returns a coroutine/awaitable, we await it.
    """
    try:
        raw = get_candidates()
        if inspect.isawaitable(raw):
            candidates = await raw
        else:
            candidates = raw

        # Defensive: ensure list-like
        if candidates is None:
            candidates = []
        elif not isinstance(candidates, (list, tuple)):
            candidates = [candidates]

        logger.info(f"Scan found {len(candidates)} candidate(s)")
        # TODO: process candidates here…

    except Exception as e:
        msg = f"⚠️ Scanner error: {str(e)[:200]}"
        logger.error("Scan loop error", exc_info=True)
        try:
            # send_maint is async-safe (uses asyncio.to_thread internally)
            await send_maint({"text": msg, "level": "warning"})
        except Exception as notify_err:
            logger.error(f"Failed to send maintenance notification: {notify_err}")

def start_scheduler():
    """
    Start background scheduler (1-minute interval, no overlap).
    """
    try:
        scheduler.add_job(
            _scan_once,
            trigger=IntervalTrigger(minutes=1),
            id="scan_candidates",
            name="Scan for trading candidates",
            max_instances=1,
            misfire_grace_time=30
        )
        scheduler.start()
        logger.info("Scheduler started")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise

def stop_scheduler():
    try:
        if scheduler.running:
            scheduler.shutdown(wait=True)
            logger.info("Scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {e}")