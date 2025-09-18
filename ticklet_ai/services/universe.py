"""
Symbol universe resolution for background scans.

Priority:
1) If env TICKLET_SYMBOLS != 'any', use that explicit comma list.
2) If 'any', use per-strategy declared symbols (registry), when provided.
3) Otherwise, auto-select a universe from Binance (top USDT pairs by 24h quote volume, filters applied).
"""
import os, requests

BINANCE_TICKER_24H = "https://api.binance.com/api/v3/ticker/24hr"

def explicit_env_symbols() -> list[str] | None:
    raw = os.getenv("TICKLET_SYMBOLS","any").strip()
    if raw.lower() == "any":
        return None
    return [s.strip() for s in raw.split(",") if s.strip()]

def default_auto_symbols(limit: int = 40, min_quote_volume: float = 100_000.0) -> list[str]:
    # USDT pairs by quote volume (desc)
    try:
        r = requests.get(BINANCE_TICKER_24H, timeout=10)
        r.raise_for_status()
        data = r.json()
        ranked = sorted(
            [d for d in data if d.get("symbol","").endswith("USDT")],
            key=lambda d: float(d.get("quoteVolume") or 0.0),
            reverse=True
        )
        syms = []
        for d in ranked:
            try:
                qv = float(d.get("quoteVolume") or 0.0)
                if qv >= min_quote_volume:
                    syms.append(d["symbol"])
                    if len(syms) >= limit:
                        break
            except Exception:
                continue
        return syms or ["BTCUSDT","ETHUSDT","XRPUSDT","SHIBUSDT"]
    except Exception:
        return ["BTCUSDT","ETHUSDT","XRPUSDT","SHIBUSDT"]