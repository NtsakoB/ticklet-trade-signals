from fastapi import APIRouter, Request, Query
from fastapi.responses import RedirectResponse, JSONResponse

router = APIRouter(tags=["insights-compat"])

@router.get("/missed-opportunities", summary="Compat: redirect to /api/signals?type=missed")
async def missed_opportunities():
    # 307 preserves method; keeps older frontends happy
    return RedirectResponse(url="/api/signals?type=missed", status_code=307)

@router.get("/lowest-price", summary="Compat stub for legacy UI calls")
async def lowest_price(
    symbols: str | None = Query(default=None, description="CSV of symbols, e.g. BTCUSDT,ETHUSDT"),
    interval: str = Query(default="1h"),
    lookback: int = Query(default=200)
):
    """
    Compatibility endpoint to prevent 404s from older builds that call /api/lowest-price.
    Returns a benign payload and a message. Upgrade later to compute from /market/klines.
    """
    items = []
    if symbols:
        for sym in [s.strip() for s in symbols.split(",") if s.strip()]:
            items.append({"symbol": sym, "lowest": None, "interval": interval, "lookback": lookback})
    return JSONResponse(
        {
            "items": items,
            "message": "compatibility endpoint: prefer /api/signals?type=lowest or a dedicated lowest-price route",
            "status": "ok"
        }
    )