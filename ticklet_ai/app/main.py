import logging
from fastapi import FastAPI
from starlette.middleware import Middleware
from logging.handlers import RotatingFileHandler
from ticklet_ai.app.middleware.preview_auth import PreviewBypassMiddleware
from ticklet_ai.app.tasks import scheduler
from ticklet_ai.config import settings
from ticklet_ai.utils.paths import LOGS_DIR

log = logging.getLogger(__name__)
middleware = [Middleware(PreviewBypassMiddleware)]
app = FastAPI(middleware=middleware)
# Configure rotating file logging safely under LOGS_DIR
try:
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    fh = RotatingFileHandler((LOGS_DIR / 'ticklet.log'), maxBytes=2_000_000, backupCount=3)
    fmt = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
    fh.setFormatter(fmt)
    root = logging.getLogger()
    if not any(isinstance(h, RotatingFileHandler) for h in root.handlers):
        root.addHandler(fh)
except Exception as e:
    logging.getLogger(__name__).warning('File logging disabled: %s', e)
# Validate env on startup
settings.validate()

from ticklet_ai.core.pipeline import scan_and_send_signals

@app.get('/healthz')
def healthz():
    return {'ok': True, 'service': 'ticklet-web'}

@app.get('/debug/env')
def debug_env():
    return {
        'APP_ENV': settings.APP_ENV,
        'TZ': settings.TZ,
        'ENABLE_TELEGRAM': settings.ENABLE_TELEGRAM,
        'ENABLE_PAPER_TRADING': settings.ENABLE_PAPER_TRADING,
        'ENABLE_AI_TRAINING': settings.ENABLE_AI_TRAINING,
        'SCAN_INTERVAL_CRON': settings.SCAN_INTERVAL_CRON,
        'TRAINING_CRON': settings.TRAINING_CRON,
        'SUPABASE_URL_set': bool(settings.SUPABASE_URL),
        'SUPABASE_ANON_KEY_set': bool(settings.SUPABASE_ANON_KEY),
        'SUPABASE_SERVICE_ROLE_KEY_set': bool(settings.SUPABASE_SERVICE_ROLE_KEY),
        'BINANCE_KEY_set': bool(settings.BINANCE_KEY),
        'OPENAI_KEY_set': bool(settings.OPENAI_KEY)
    }

@app.post('/debug/run-scan-now')
def run_scan_now():
    summary = scan_and_send_signals()
    return {'ok': True, 'summary': summary}

try:
    from ticklet_ai.app.routes import api as api_router
    app.include_router(api_router)
except Exception:
    pass

@app.on_event("startup")
async def _start():
    try:
        scheduler.start()
    except Exception as e:
        log.critical(f"Scheduler failed to start: {e}")

@app.on_event("shutdown")
async def _stop():
    try:
        scheduler.stop()
    except Exception:
        pass

@app.get("/health")
async def health():
    return {"ok": True}