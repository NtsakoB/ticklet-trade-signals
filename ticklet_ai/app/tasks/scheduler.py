import os, asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from ticklet_ai.services.scanner import get_candidates
from ticklet_ai.services.signal_filter import rideout_should_alert
from ticklet_ai.services.notifier import send_trade, send_maint

_scheduler: AsyncIOScheduler | None = None

def _tz():
    return os.getenv("SCHED_TZ", "Africa/Johannesburg")

async def _scan_once():
    try:
        cands = await get_candidates()
        hits = 0
        for c in cands:
            ok, meta = rideout_should_alert(c)
            if ok:
                await send_trade(meta); hits += 1
        if hits == 0:
            await send_maint({"msg": "No alerts this pass", "ts": datetime.utcnow().isoformat()})
    except Exception as e:
        await send_maint({"level": "error", "msg": f"scan loop error: {e}"})

async def _daily_report():
    try:
        await send_maint({"msg": "Daily AI report dispatched"})
    except Exception as e:
        await send_maint({"level": "error", "msg": f"daily report error: {e}"})

def start(loop=None):
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = AsyncIOScheduler(timezone=_tz())
    interval = int(os.getenv("SIGNAL_LOOP_INTERVAL", "60"))
    _scheduler.add_job(lambda: asyncio.create_task(_scan_once()),
                       trigger="interval", seconds=interval, id="scan_loop", replace_existing=True)
    hh = int(os.getenv("SCHEDULER_HOUR", "10"))
    mm = int(os.getenv("SCHEDULER_MINUTE", "0"))
    _scheduler.add_job(lambda: asyncio.create_task(_daily_report()),
                       CronTrigger(hour=hh, minute=mm, timezone=_tz()),
                       id="daily_report", replace_existing=True)
    _scheduler.start()
    return _scheduler

def stop():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None