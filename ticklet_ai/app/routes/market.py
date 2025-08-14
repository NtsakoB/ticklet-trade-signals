from fastapi import APIRouter, Query

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/symbols")
def symbols():
    return {"symbols": ["BTCUSDT","ETHUSDT","BNBUSDT"]}

@router.get("/ticker")
def ticker(symbol: str = Query(...)):
    return {"symbol": symbol, "price": 68000.0}

@router.get("/klines")
def klines(symbol: str, interval: str, limit: int = 500):
    # Replace with real proxied data if needed
    return [{"t": i, "o": 1, "h": 2, "l": 0.5, "c": 1.5, "v": 100000+i} for i in range(limit)]