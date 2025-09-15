from fastapi import FastAPI
from ticklet_ai.config import settings
try:
    from ticklet_ai.core.pipeline import scan_and_send_signals
except Exception:
    scan_and_send_signals = None

app = FastAPI()
settings.validate_web()

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