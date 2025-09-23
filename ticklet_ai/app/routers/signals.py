from fastapi import APIRouter, Query, HTTPException
from typing import Literal, Any, Dict, List
from datetime import datetime, timedelta
from ._deps import get_supabase_client

router = APIRouter(prefix="/api", tags=["signals"])
T = Literal["active","recent","missed","low_entry","lowest"]

@router.get("/signals")
async def signals(type: T = Query(...), limit: int = 50, interval: str = "1h", lookback: int = 168) -> Dict[str, Any]:
    sb = get_supabase_client()
    titles = {"active":"Active Signals","recent":"Recent Signals","missed":"Missed Opportunities","low_entry":"Low Entry Watchlist","lowest":"Lowest Price"}

    if type in ("active","recent","low_entry","missed"):
        if type == "active":
            q = sb.table("signals").select("*").eq("status","ACTIVE").order("created_at", desc=True).limit(limit)
        elif type == "recent":
            since = (datetime.utcnow() - timedelta(hours=24)).isoformat()
            q = sb.table("signals").select("*").gte("created_at", since).order("created_at", desc=True).limit(limit)
        elif type == "low_entry":
            q = sb.table("signals").select("*").eq("classification","LOW_ENTRY").order("created_at", desc=True).limit(limit)
        else:
            q = sb.table("signals").select("*").eq("classification","MISSED").order("created_at", desc=True).limit(limit)
        data = q.execute().data or []
        return {"title": titles[type], "items": data}

    if type == "lowest":
        rows = sb.table("signals").select("symbol").order("created_at", desc=True).limit(200).execute().data or []
        symbols = sorted({r["symbol"] for r in rows})
        out: List[Dict[str, Any]] = []
        # For lowest price calculation, we'd need market data - for now return mock data
        for s in symbols[:limit]:
            out.append({
                "symbol": s, 
                "lowest": 0.0, 
                "current": 0.0, 
                "distance_from_low": 0.0
            })
        return {"title": titles["lowest"], "items": out}

    raise HTTPException(status_code=400, detail="Bad type")