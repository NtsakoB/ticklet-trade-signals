from fastapi import APIRouter, Query, HTTPException
from typing import Literal, Any, Dict, List
from datetime import datetime, timedelta
from ._deps import get_supabase_client
from ...services.market_analyzers.lowest_price_scanner import get_near_lows
from ...services.market_analyzers.low_entry_watchlist import get_low_entry_watchlist
from ...services.ai_helpers.missed_opportunity_ai import get_missed_opportunities
from ...services.universe import explicit_env_symbols

router = APIRouter(prefix="/api", tags=["signals"])
T = Literal["active","recent","missed","low_entry","lowest"]

def get_target_symbols() -> List[str]:
    """Get list of symbols to monitor"""
    explicit = explicit_env_symbols()
    if explicit:
        return explicit
    return [
        'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
        'XRPUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT',
        'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'FILUSDT',
        'TRXUSDT', 'XLMUSDT', 'HBARUSDT', 'ARBUSDT', 'LDOUSDT'
    ]

def normalize_db_signal(signal: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize database signal format to frontend expected format"""
    # Extract targets from object to array
    targets_obj = signal.get('targets', {})
    if isinstance(targets_obj, dict):
        targets = [
            targets_obj.get('tp1', 0),
            targets_obj.get('tp2', 0),
            targets_obj.get('tp3', 0)
        ]
    else:
        targets = targets_obj if isinstance(targets_obj, list) else []
    
    return {
        'symbol': signal.get('symbol'),
        'side': signal.get('side'),
        'entry': signal.get('entry_price', signal.get('entry')),
        'stop': signal.get('stop_loss', signal.get('stop_price', signal.get('stop'))),
        'targets': targets,
        'ai_commentary': signal.get('ai_summary', signal.get('ai_commentary', '')),
        'ml_confidence': signal.get('confidence', signal.get('ml_confidence', 0)),
        'strategy': signal.get('strategy'),
        'status': signal.get('status'),
        'created_at': signal.get('created_at'),
        'anomaly': signal.get('anomaly', 0),
        'volatility_pct': signal.get('volatility_pct', 0),
        'meta': signal.get('meta', {})
    }

@router.get("/signals")
async def signals(type: T = Query(...), limit: int = 50, interval: str = "1h", lookback: int = 168) -> Dict[str, Any]:
    sb = get_supabase_client()
    titles = {
        "active": "Active Signals",
        "recent": "Recent Signals", 
        "missed": "Missed Opportunities",
        "low_entry": "Low Entry Watchlist",
        "lowest": "Lowest Price"
    }

    # For database-backed types, query Supabase
    if type in ("active", "recent"):
        if type == "active":
            q = sb.table("signals").select("*").eq("status", "ACTIVE").order("created_at", desc=True).limit(limit)
        else:  # recent
            since = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            q = sb.table("signals").select("*").gte("created_at", since).order("created_at", desc=True).limit(limit)
        
        raw_data = q.execute().data or []
        # Normalize each signal to match frontend expectations
        normalized = [normalize_db_signal(s) for s in raw_data]
        return {"title": titles[type], "items": normalized}

    # For analysis-based types, use live Binance data
    symbols = get_target_symbols()
    
    if type == "missed":
        # Fetch missed opportunities using live data
        items = get_missed_opportunities(symbols, interval="5m", lookback=30)
        return {"title": titles["missed"], "items": items}
    
    elif type == "low_entry":
        # Fetch low entry watchlist using live data
        items = get_low_entry_watchlist(symbols, interval="5m", lookback=50)
        return {"title": titles["low_entry"], "items": items}
    
    elif type == "lowest":
        # Fetch symbols near lowest prices using live data
        from ...services.data_sources import get_klines_from_exchange
        
        # Build candles dict for analyzer
        all_candles = {}
        for symbol in symbols:
            candles = get_klines_from_exchange(symbol, interval="1h", limit=168)
            if candles:
                all_candles[symbol] = candles
        
        items = get_near_lows(all_candles, threshold=0.03)
        return {"title": titles["lowest"], "items": items}

    raise HTTPException(status_code=400, detail="Bad type")