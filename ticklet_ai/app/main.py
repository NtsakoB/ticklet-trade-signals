import os
import logging
import signal, threading, time, sys
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path

from ticklet_ai.config import settings
try:
    from ticklet_ai.core.pipeline import scan_and_send_signals
except Exception:
    scan_and_send_signals = None

logger = logging.getLogger("ticklet")
logger.setLevel(logging.INFO)
_ENV_GATE = os.getenv("DEBUG_ENV_KEY", "").strip()

# Optional: allow overriding favicon path at deploy time
FAVICON_PATH = Path(os.getenv("FAVICON_PATH", "assets/favicon.png"))

# Ensure assets dir exists at runtime
FAVICON_PATH.parent.mkdir(parents=True, exist_ok=True)

# --- Safe env filtering helpers ---
SAFE_EXACT = {
    "TZ", "PYTHON_VERSION", "RENDER_SERVICE_NAME", "RENDER_SERVICE_ID",
    "RENDER_INSTANCE_ID", "RENDER_GIT_BRANCH", "RENDER", "PORT",
    "GIT_COMMIT", "COMMIT_SHA", "ENV", "NODE_ENV", "APP_ENV",
}
SAFE_PREFIXES = ("ENABLE_", "FEATURE_", "FLAG_", "APP_", "SERVICE_", "UVICORN_")
# Allow some project-scoped names that don't look like secrets
SAFE_PROJECT_PREFIXES = ("TICKLET_",)
SECRET_MARKERS = ("SECRET", "TOKEN", "KEY", "PASSWORD", "PASS", "PRIVATE", "ANON")

def _looks_secret(name: str) -> bool:
    upper = name.upper()
    return any(m in upper for m in SECRET_MARKERS)

def _is_safe_name(name: str) -> bool:
    if name in SAFE_EXACT: return True
    if _looks_secret(name): return False
    if name.startswith(SAFE_PREFIXES): return True
    # Project-scoped: allow if not "secret-looking"
    if name.startswith(SAFE_PROJECT_PREFIXES) and not _looks_secret(name): return True
    return False

def _safe_env():
    out = {}
    for k, v in os.environ.items():
        if _is_safe_name(k):
            # Trim overly long values for safety/UX
            sval = str(v)
            out[k] = sval if len(sval) <= 200 else sval[:200] + "…"
    return dict(sorted(out.items()))

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("✅ Ticklet API starting up")
    
    # --- Signal diagnostics ---
    def _signal_handler(signum, frame):
        logger.error("⚠️ Received signal %s; pid=%s; exiting...", signum, os.getpid())
    try:
        signal.signal(signal.SIGTERM, _signal_handler)
        signal.signal(signal.SIGINT, _signal_handler)
    except Exception as e:
        logger.warning("Signal handler setup failed: %s", e)
    
    # background heartbeat (every 15s) so logs show liveness unless we're killed
    def _beat():
        while True:
            logger.info("WEB heartbeat: alive pid=%s", os.getpid())
            time.sleep(15)
    t = threading.Thread(target=_beat, daemon=True, name="web-heartbeat")
    t.start()
    
    yield
    logger.info("🛑 Ticklet API shutting down")

app = FastAPI(lifespan=lifespan)

# Dev-only CORS (prod uses same-origin via Vercel rewrite)
DEV_ORIGINS = ["http://localhost:5173", "http://localhost:4173"]

try:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=DEV_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
except Exception:
    pass

settings.validate_web()

@app.get("/", include_in_schema=False)
async def root():
    return {
        "status": "ok",
        "service": "ticklet-ai",
        "version": os.getenv("GIT_COMMIT", "dev"),
    }

@app.get("/healthz", include_in_schema=False)
async def healthz():
    return {"ok": True}

# Optional explicit HEAD handlers (FastAPI adds HEAD for GET, but this silences strict health checkers)
@app.head("/", include_in_schema=False)
async def root_head():
    return ""

@app.head("/healthz", include_in_schema=False)
async def healthz_head():
    return ""

@app.get("/favicon.ico", include_in_schema=False)
async def favicon_silence():
    return Response(status_code=204)

@app.get("/debug/favicon.ico", include_in_schema=False)
async def favicon_debug_silence():
    return Response(status_code=204)

@app.get("/debug/ping", tags=["debug"])
async def debug_ping():
    return {"ok": True}

@app.get("/debug/env", tags=["debug"])
async def debug_env(k: str | None = Query(default=None, description="Optional access key")):
    """
    Return a redacted/safe snapshot of environment variables.
    If DEBUG_ENV_KEY is set in the environment, you must provide ?k=<that value>.
    """
    if _ENV_GATE:
        if not k or k != _ENV_GATE:
            raise HTTPException(status_code=403, detail="Forbidden")
    return {
        "safe": True,
        "count": len(_safe_env()),
        "env": _safe_env(),
    }

@app.get("/debug/routes", tags=["debug"])
async def debug_routes():
    """List registered routes (method + path)."""
    routes = []
    for r in app.router.routes:
        # Some routes (like Starlette routes) use 'methods'; guard safely
        methods = sorted(getattr(r, "methods", set()) or [])
        path = getattr(r, "path", None) or getattr(r, "path_format", None)
        if path:
            routes.append({"methods": methods, "path": path})
    return {"count": len(routes), "routes": routes}

@app.post("/debug/run-scan-now", tags=["debug"])
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

try:
    from ticklet_ai.app.routes import golden_hook_x as ghx_routes
    app.include_router(ghx_routes.router, prefix="/api/strategies/golden_hook_x", tags=["golden_hook"])
    
    # Include strategy listing router
    from ticklet_ai.app.routes import strategies as strategies_router
    app.include_router(strategies_router.router, tags=["strategies"])
except Exception:
    pass

# Market router and settings endpoint
try:
    from ticklet_ai.app.routers.market import router as market_router
    app.include_router(market_router)
except Exception:
    pass

# Background runner startup and routes
try:
    from ticklet_ai.background.runner import start as start_bg
    from ticklet_ai.app.routes.bg import router as bg_router
    app.include_router(bg_router)
    
    @app.on_event("startup")
    def _ticklet_bg_start():
        start_bg()
except Exception:
    pass

# ML routes and initialization
try:
    from ticklet_ai.utils.paths import ensure_dirs
    from ticklet_ai.app.routes import ml
    app.include_router(ml.router)
    
    @app.on_event("startup")
    def _ml_bootstrap():
        ensure_dirs()
except Exception:
    pass

@app.get("/settings")
async def settings():
    return {
        "ok": True,
        "preview": False,
        "binance": {"base_url": "https://api.binance.com"},
        "ui": {"connectedLabel": "Connected to Binance API (Real Data)"},
        "volume_filter": "≥$10M"
    }