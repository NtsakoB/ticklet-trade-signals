from fastapi import FastAPI
from .routes import market, chat, feedback, telegram, signals, settings, paper, backtest
from .tasks import scheduler

app = FastAPI(title="Ticklet AI Backend")

app.include_router(market.router)
app.include_router(chat.router)
app.include_router(feedback.router)
app.include_router(telegram.router)
app.include_router(signals.router)
app.include_router(settings.router)
app.include_router(paper.router)
app.include_router(backtest.router)

@app.get("/health")
async def health():
    return {"ok": True}

@app.on_event("startup")
async def _startup():
    await scheduler.start()

@app.on_event("shutdown")
async def _shutdown():
    await scheduler.stop()