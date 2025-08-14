import logging
from fastapi import FastAPI
from starlette.middleware import Middleware
from ticklet_ai.app.middleware.preview_auth import PreviewBypassMiddleware
from ticklet_ai.app.tasks import scheduler

log = logging.getLogger(__name__)
middleware = [Middleware(PreviewBypassMiddleware)]
app = FastAPI(middleware=middleware)
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