from fastapi import APIRouter
from datetime import datetime
from typing import Dict, Any, List
import os, csv, pathlib

router = APIRouter(prefix="/api", tags=["dashboard"])
legacy_router = APIRouter(prefix="", tags=["dashboard-legacy"])

# --- Data sources: Supabase → CSV fallback ---
def _has_supabase() -> bool:
    return bool(os.getenv("TICKLET_SUPABASE_URL")) and bool(os.getenv("TICKLET_SUPABASE_SERVICE_ROLE_KEY") or os.getenv("TICKLET_SUPABASE_ANON_KEY"))

def _sb():
    if not _has_supabase():
        return None
    from supabase import create_client
    url = os.environ["TICKLET_SUPABASE_URL"]
    key = os.getenv("TICKLET_SUPABASE_SERVICE_ROLE_KEY") or os.environ["TICKLET_SUPABASE_ANON_KEY"]
    return create_client(url, key)

def _csv(table: str) -> List[Dict[str, Any]]:
    p = pathlib.Path("data") / f"{table}.csv"
    if not p.exists():
        return []
    with p.open() as f:
        return list(csv.DictReader(f))

def _fetch(table: str) -> List[Dict[str, Any]]:
    sb = _sb()
    if sb:
        try:
            return sb.table(table).select("*").execute().data or []
        except Exception:
            pass
    return _csv(table)

def _summary_payload() -> Dict[str, Any]:
    # Pull trades/signals
    trades = _fetch("trades") or _fetch("paper_trades") or []
    signals = _fetch("signals")

    # Open / closed partition
    open_trades = [t for t in trades if str(t.get("status","")).lower() in ("open","running") or not t.get("closed_at")]
    closed_trades = [t for t in trades if str(t.get("status","")).lower() in ("closed","done") or t.get("closed_at")]

    # Win rate (0..1)
    wins, losses = 0, 0
    for t in closed_trades:
        pnl = float(t.get("pnl_pct") or 0)
        winf = t.get("win")
        if winf is True or pnl > 0:
            wins += 1
        elif winf is False or pnl < 0:
            losses += 1
    denom = wins + losses
    win_rate = 0.0 if denom == 0 else wins / denom

    # Capital at risk
    def _cap(t: Dict[str, Any]) -> float:
        size = float(t.get("position_size_usdt") or 0)
        if size > 0:
            return size
        qty = float(t.get("quantity") or 0)
        entry = float(t.get("entry") or t.get("entry_price") or 0)
        return qty * entry
    capital_at_risk = sum(_cap(t) for t in open_trades)

    # Balance model (optional tables: balances, performance_history)
    balances = _fetch("balances")
    starting_balance = 5000.0
    total_balance = starting_balance
    if balances:
        try:
            latest = max(balances, key=lambda r: r.get("created_at",""))
            total_balance = float(latest.get("balance") or starting_balance)
            starting_balance = float(latest.get("starting_balance") or starting_balance)
        except Exception:
            pass

    perf = _fetch("performance_history")
    if not perf:
        # minimal viable history to satisfy UI
        perf = [{
            "date": datetime.utcnow().isoformat(),
            "balance": total_balance,
            "win_rate": win_rate,
            "trades_count": len(closed_trades),
        }]

    now = datetime.utcnow().isoformat()
    # active signals prefer open trades; fall back to signals with active/open status
    active_signals = len(open_trades) if open_trades else sum(1 for s in signals if str(s.get("status","")).lower() in ("active","open"))

    # WIN RATE MUST BE 0..1 to match LiveStatsCards.tsx
    return {
        "active_signals": int(active_signals),
        "executed_trades": int(len(closed_trades)),
        "win_rate": float(round(win_rate, 6)),
        "capital_at_risk": float(round(capital_at_risk, 2)),
        "total_balance": float(round(total_balance, 2)),
        "starting_balance": float(round(starting_balance, 2)),
        "performance_history": [
            {
                "date": r.get("date") or r.get("created_at") or now,
                "balance": float(r.get("balance") or total_balance),
                "win_rate": float(r.get("win_rate") or win_rate),
                "trades_count": int(r.get("trades_count") or len(closed_trades)),
            } for r in perf
        ],
        "last_updated": now,
    }

@router.get("/summary/dashboard")
def summary_dashboard():
    return _summary_payload()

# Modern alias
@router.get("/dashboard/summary")
def dashboard_summary_alias():
    return _summary_payload()

# Legacy alias (no /api)
@legacy_router.get("/summary/dashboard")
def summary_dashboard_legacy():
    return _summary_payload()