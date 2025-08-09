import os
import anyio
import time
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.models import PushRequest, PushResponse
from app.logger import setup_logger
from app.security import require_auth, idempotent
from app.telegram import send_text, send_photo
from app.metrics import (
    push_requests_total,
    telegram_dispatch_total,
    telegram_latency_ms,
    circuit_breaker_state,
)
from app.breaker import CircuitBreaker
from app.rate_limit import TokenBucket, rate_limit_decorator
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
import uuid

logger = setup_logger()
app = FastAPI()
breaker = CircuitBreaker(
    failure_threshold=float(os.getenv("CB_FAILURE_THRESHOLD", 0.5)),
    min_calls=int(os.getenv("CB_MIN_CALLS", 20)),
    cooldown_seconds=int(os.getenv("CB_COOLDOWN_SECONDS", 120))
)
bucket = TokenBucket(
    capacity=int(os.getenv("GLOBAL_RPS_LIMIT", 20)),
    refill_rate=int(os.getenv("GLOBAL_RPS_LIMIT", 20)),
)
sema = anyio.Semaphore(int(os.getenv("SINK_CONCURRENCY", 5)))

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID_SIGNALS = os.getenv("TELEGRAM_CHAT_ID_SIGNALS")
CHAT_ID_MAINT = os.getenv("TELEGRAM_CHAT_ID_MAINT")
TICKLET_SHARED_SECRET = os.getenv("TICKLET_SHARED_SECRET", "")

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)

@app.get("/healthz")
async def healthz():
    return PlainTextResponse("ok", status_code=200)

@app.get("/readyz")
async def readyz():
    if not TELEGRAM_BOT_TOKEN or not CHAT_ID_SIGNALS or not CHAT_ID_MAINT:
        return PlainTextResponse("not ready", status_code=503)
    return PlainTextResponse("ready", status_code=200)

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.post("/push")
@rate_limit_decorator(bucket)
async def push(request: Request):
    raw_body = await request.body()
    await require_auth(request, raw_body, TICKLET_SHARED_SECRET)
    data = PushRequest.parse_raw(raw_body)
    idem_key = request.headers.get("X-Idempotency-Key")
    if not idem_key:
        raise HTTPException(status_code=400, detail="Missing idempotency key")
    prev = idempotent(idem_key)
    if prev:
        push_requests_total.labels(result="idempotent").inc()
        return JSONResponse(content=eval(prev), status_code=409)
    channel_map = {
        "signals": CHAT_ID_SIGNALS,
        "maintenance": CHAT_ID_MAINT
    }
    chat_id = channel_map[data.channel]
    resp = PushResponse(ok=False, channel=data.channel)
    if not breaker.allow():
        circuit_breaker_state.set(1)
        resp.error = "Circuit breaker open"
        push_requests_total.labels(result="circuit_breaker").inc()
        return JSONResponse(content=resp.dict(), status_code=503)
    circuit_breaker_state.set(breaker.state)
    async with sema:
        start = time.time()
        try:
            if data.image_url:
                msg_id = await send_photo(TELEGRAM_BOT_TOKEN, chat_id, data.image_url, data.text)
                telegram_dispatch_total.labels(kind="photo").inc()
            else:
                msg_id = await send_text(TELEGRAM_BOT_TOKEN, chat_id, data.text)
                telegram_dispatch_total.labels(kind="text").inc()
            latency = (time.time() - start) * 1000
            telegram_latency_ms.observe(latency)
            resp.ok = True
            resp.message_id = msg_id
            breaker.record_success()
            idempotent(idem_key, str(resp.dict()))
            push_requests_total.labels(result="success").inc()
            logger.info("Push success", channel=data.channel, message_id=msg_id, request_id=request.state.request_id)
            return JSONResponse(content=resp.dict())
        except Exception as exc:
            breaker.record_failure()
            resp.error = str(exc)
            push_requests_total.labels(result="failure").inc()
            logger.error("Push failed", error=resp.error, channel=data.channel, request_id=request.state.request_id)
            return JSONResponse(content=resp.dict(), status_code=502)
