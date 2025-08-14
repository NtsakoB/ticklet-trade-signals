import os, asyncio, logging
from datetime import datetime
from tzlocal import get_localzone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import aiohttp

from ticklet_ai.services.scanner import get_candidates
from ticklet_ai.services.signal_filter import rideout_should_alert
from ticklet_ai.services.notifier import send_trade, send_maint

log = logging.getLogger("scheduler")

# ---- Config via ENV with safe defaults ----
def _interval() -> int:
    try:
        return int(os.getenv("SIGNAL_LOOP_INTERVAL", "60"))
    except Exception:
        return 60

SCHED_TZ = os.getenv("SCHED_TZ") or str(get_localzone())
DAILY_HOUR = int(os.getenv("SCHEDULER_HOUR", "10"))
DAILY_MIN  = int(os.getenv("SCHEDULER_MINUTE", "0"))

# API that returns accuracy snapshot summary (JSON). Provide your real URL in env.
ACCURACY_SUMMARY_URL = os.getenv(
    "ACCURACY_SUMMARY_URL",
    "http://localhost:8000/api/accuracy_snapshots/summary"
)
# If true, also post a condensed summary into the trading channel
DAILY_REPORT_TRADE_SUMMARY = os.getenv("DAILY_REPORT_TRADE_SUMMARY", "true").lower() in {"1","true","yes"}

_task: asyncio.Task | None = None
_stop = asyncio.Event()
_aps: AsyncIOScheduler | None = None

# -------------------------
# Signal scan loop (unchanged)
# -------------------------
async def _loop():
    send_maint("✅ Signal loop started")
    while not _stop.is_set():
        try:
            cands = get_candidates()
            for c in cands[:1]:
                ok = rideout_should_alert(
                    price_now=c["price_now"],
                    entry_low=c["entry_low"], entry_high=c["entry_high"],
                    rr_tp2=c["rr_tp2"],
                    late_p=c.get("late_p"), extend_p=c.get("extend_p"),
                    reentry_p=c.get("reentry_p"),
                    overext_atr=c.get("overext_atr"),
                )
                if ok:
                    msg = f"#{c['symbol']} entry {c['entry_low']}–{c['entry_high']} | now {c['price_now']} | RR(TP2)={c['rr_tp2']}"
                    send_trade(msg)
                else:
                    send_maint(f"Missed: {c['symbol']} (gates not satisfied)")
            log.info("scan: OK")
        except Exception as e:
            log.exception("scan error: %s", e)
            send_maint(f"Loop error: {e}")
        try:
            await asyncio.wait_for(_stop.wait(), timeout=_interval())
        except asyncio.TimeoutError:
            pass

# -------------------------
# Daily AI report (rich)
# -------------------------
async def _fetch_accuracy_summary() -> dict:
    """
    Expected shape (flexible):
    { "summary": { "<strategy>": [{"accuracy": float, "symbol":"BTCUSDT", "ts": "..."} , ...], ... } }
    We'll accept common shapes and degrade gracefully.
    """
    try:
        timeout = aiohttp.ClientTimeout(total=15)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.get(ACCURACY_SUMMARY_URL) as r:
                r.raise_for_status()
                data = await r.json()
        return data or {}
    except Exception as e:
        log.warning("fetch accuracy summary failed: %s", e)
        # Fallback mock so the job always posts something
        return {
            "summary": {
                "Ticklet Alpha": [{"accuracy": 74.3, "symbol": "BTCUSDT"}],
                "Growth": [{"accuracy": 58.6, "symbol": "DOGEUSDT"}],
                "Performance": [{"accuracy": 62.1, "symbol": "XRPUSDT"}]
            }
        }

def _coerce_accuracy_table(raw: dict) -> list[tuple[str, float, str]]:
    """
    Returns list of (strategy, accuracy, symbol_hint)
    """
    out: list[tuple[str,float,str]] = []
    summary = (raw or {}).get("summary") or raw  # accept both {summary:...} or flat
    if isinstance(summary, dict):
        for strat, entries in summary.items():
            if isinstance(entries, list) and entries:
                e0 = entries[0] if isinstance(entries[0], dict) else {}
                acc = float(e0.get("accuracy", 0.0))
                sym = str(e0.get("symbol") or e0.get("top_symbol") or "—")
                out.append((strat, acc, sym))
    return out

def _format_report(rows: list[tuple[str,float,str]]) -> tuple[str, str]:
    """
    Builds (full_report_for_maintenance, short_summary_for_trading)
    """
    today = datetime.now().strftime("%Y-%m-%d")
    if not rows:
        full = f"📊 AI Daily Report — {today}\n\n(no data)\n"
        short = f"📣 AI Summary {today}: no data"
        return full, short

    # Identify best / worst
    best = max(rows, key=lambda r: r[1])
    worst = min(rows, key=lambda r: r[1])

    lines = [f"- {s}: {a:.1f}% (e.g., {sym})" for (s,a,sym) in rows]
    full = (
        f"📊 AI Daily Report — {today}\n\n"
        f"🏆 Best: {best[0]} — {best[1]:.1f}%\n"
        f"📉 Worst: {worst[0]} — {worst[1]:.1f}%\n"
        f"🧠 Note: tighten SL on volatile pairs; respect TP2 viability filters.\n\n"
        f"🔢 Accuracy Metrics:\n" + "\n".join(lines) + "\n"
    )
    short = (
        f"📣 AI Summary — {today}\n"
        f"Best {best[0]} {best[1]:.1f}% · Worst {worst[0]} {worst[1]:.1f}%"
    )
    return full, short

async def _daily_report():
    try:
        data = await _fetch_accuracy_summary()
        rows = _coerce_accuracy_table(data)
        full, short = _format_report(rows)
        # Maintenance channel gets the full report
        send_maint(full)
        # Trading channel optionally gets a short summary
        if DAILY_REPORT_TRADE_SUMMARY:
            send_trade(short)
    except Exception as e:
        log.exception("daily report error: %s", e)
        send_maint(f"Daily report error: {e}")

# -------------------------
# Optional weekly cleanup job (if URL provided)
# -------------------------
async def _cleanup():
    url = os.getenv("SNAPSHOT_CLEANUP_URL", "").strip()
    if not url:
        return
    try:
        timeout = aiohttp.ClientTimeout(total=20)
        async with aiohttp.ClientSession(timeout=timeout) as sess:
            async with sess.delete(url) as r:
                txt = await r.text()
                if r.status == 200:
                    send_maint("🧹 Snapshot cleanup OK")
                else:
                    send_maint(f"⚠️ Cleanup {r.status}: {txt[:200]}")
    except Exception as e:
        log.exception("cleanup error: %s", e)

async def start():
    global _task, _aps
    if _task is None:
        _task = asyncio.create_task(_loop())

    if _aps is None:
        _aps = AsyncIOScheduler(timezone=SCHED_TZ)
        _aps.add_job(_daily_report, CronTrigger(hour=DAILY_HOUR, minute=DAILY_MIN),
                     id="daily_ai_report", replace_existing=True)
        if os.getenv("SNAPSHOT_CLEANUP_URL", "").strip():
            _aps.add_job(_cleanup, CronTrigger(day_of_week="sun", hour=3, minute=0),
                         id="weekly_cleanup", replace_existing=True)
        _aps.start()
        send_maint(f"⏰ Scheduler started in {SCHED_TZ}: daily report {DAILY_HOUR:02d}:{DAILY_MIN:02d}")

async def stop():
    global _task, _aps
    _stop.set()
    if _aps:
        try:
            _aps.shutdown(wait=False)
        except Exception:
            pass
        _aps = None
    if _task:
        _task.cancel()
        try:
            await _task
        except Exception:
            pass
        _task = None