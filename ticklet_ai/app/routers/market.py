from fastapi import APIRouter, HTTPException, Query
import httpx
from typing import List, Any

BINANCE_BASE = "https://api.binance.com"

router = APIRouter(prefix="/market", tags=["market"])

@router.get("/symbols")
async def get_symbols(quote: str = "USDT") -> List[str]:
  """
  Returns a simple list of tradable symbols filtered by quote (default USDT).
  """
  url = f"{BINANCE_BASE}/api/v3/exchangeInfo"
  timeout = httpx.Timeout(10.0, connect=5.0)
  async with httpx.AsyncClient(timeout=timeout) as client:
    r = await client.get(url)
    r.raise_for_status()
    data = r.json()
  symbols = []
  for s in data.get("symbols", []):
    if s.get("status") == "TRADING" and s.get("quoteAsset") == quote:
      symbols.append(s.get("symbol"))
  symbols.sort()
  return symbols

@router.get("/klines")
async def get_klines(
  symbol: str = Query(..., min_length=3),
  interval: str = Query("1h"),
  limit: int = Query(200, ge=1, le=1000),
) -> Any:
  """
  Proxy klines from Binance; returns raw array (ts, open, high, low, close, volume, ...).
  """
  url = f"{BINANCE_BASE}/api/v3/klines"
  params = {"symbol": symbol.upper(), "interval": interval, "limit": limit}
  timeout = httpx.Timeout(10.0, connect=5.0)
  try:
    async with httpx.AsyncClient(timeout=timeout) as client:
      r = await client.get(url, params=params)
      r.raise_for_status()
      return r.json()
  except httpx.HTTPStatusError as e:
    raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
  except Exception as e:
    raise HTTPException(status_code=502, detail=f"Upstream error: {e}")