from fastapi import FastAPI
from starlette.middleware import Middleware
from ticklet_ai.app.middleware.preview_auth import PreviewBypassMiddleware
from ticklet_ai.app.tasks import scheduler

middleware = [Middleware(PreviewBypassMiddleware)]
app = FastAPI(middleware=middleware)

@app.on_event("startup")
async def _start():
    scheduler.start()

@app.on_event("shutdown")
async def _stop():
    scheduler.stop()

@app.get("/health")
async def health():
    return {"ok": True}

try:
    from ticklet_ai.app.routes import api as api_router
    app.include_router(api_router)
except Exception:
    # routes package might already be wired elsewhere
    pass