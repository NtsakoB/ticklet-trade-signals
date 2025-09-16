from fastapi import FastAPI
import signal, threading, time, os, sys, logging
logger = logging.getLogger("ticklet.web")

from ticklet_ai.config import settings
try:
    from ticklet_ai.core.pipeline import scan_and_send_signals
except Exception:
    scan_and_send_signals = None

app = FastAPI()
settings.validate_web()

# --- Signal diagnostics ---
def _signal_handler(signum, frame):
    logger.error("⚠️ Received signal %s; pid=%s; exiting...", signum, os.getpid())
try:
    signal.signal(signal.SIGTERM, _signal_handler)
    signal.signal(signal.SIGINT, _signal_handler)
except Exception as e:
    logger.warning("Signal handler setup failed: %s", e)

# --- Startup/shutdown diagnostics ---
@app.on_event("startup")
async def _on_startup():
    logger.info("✅ WEB startup: pid=%s, TZ=%s, scan_cron=%s", os.getpid(), settings.TZ, settings.SCAN_INTERVAL_CRON)
    # background heartbeat (every 15s) so logs show liveness unless we're killed
    def _beat():
        while True:
            logger.info("WEB heartbeat: alive pid=%s", os.getpid())
            time.sleep(15)
    t = threading.Thread(target=_beat, daemon=True, name="web-heartbeat")
    t.start()

@app.on_event("shutdown")
async def _on_shutdown():
    logger.error("🛑 WEB shutdown initiated: pid=%s", os.getpid())

@app.get("/")
def root():
    return {"ok": True, "service": "ticklet-web", "message": "Ticklet is alive. See /healthz and /debug/env."}

@app.get("/healthz")
def healthz():
    return {"ok": True, "service": "ticklet-web"}

@app.get("/debug/env")
def debug_env():
    return {
      "APP_ENV": settings.APP_ENV,
      "TZ": settings.TZ,
      "ENABLE_AI_TRAINING": settings.ENABLE_AI_TRAINING,
      "ENABLE_PAPER_TRADING": settings.ENABLE_PAPER_TRADING,
      "ENABLE_TELEGRAM": settings.ENABLE_TELEGRAM,
      "SCAN_INTERVAL_CRON": settings.SCAN_INTERVAL_CRON,
      "TRAINING_CRON": settings.TRAINING_CRON,
      "SUPABASE_URL_set": bool(settings.SUPABASE_URL),
      "SUPABASE_ANON_KEY_set": bool(settings.SUPABASE_ANON_KEY),
      "SUPABASE_SERVICE_ROLE_KEY_set": bool(settings.SUPABASE_SERVICE_ROLE_KEY),
      "BINANCE_KEY_set": bool(settings.BINANCE_KEY),
      "OPENAI_KEY_set": bool(settings.OPENAI_KEY)
    }

@app.get("/debug/routes")
def debug_routes():
    return [{"path": r.path, "methods": list(r.methods)} for r in app.routes]

@app.get("/debug/ping")
def debug_ping():
    return {"pong": True}

@app.post("/debug/run-scan-now")
def run_scan_now():
    if not scan_and_send_signals:
        return {"ok": False, "error": "scan function unavailable"}
    summary = scan_and_send_signals()
    return {"ok": True, "summary": summary}

try:
    from ticklet_ai.app.routes import api as api_router
    app.include_router(api_router)
except Exception:
    pass