import os, json, uuid, time
from typing import Dict, Any
from fastapi import APIRouter, Body, Query, HTTPException
try:
    from ticklet_ai.utils.paths import DATA_DIR
except Exception:
    DATA_DIR = os.environ.get("TICKLET_DATA_DIR", "./data")

os.makedirs(DATA_DIR, exist_ok=True)
BT_DIR = os.path.join(DATA_DIR, "backtests")
os.makedirs(BT_DIR, exist_ok=True)

from ticklet_ai.services.backtest import BacktestParams, run_backtest

router = APIRouter(prefix="/api/backtest", tags=["backtest"])

@router.post("/run")
def run_backtest_endpoint(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    """Run comprehensive backtest with real strategy evaluation"""
    try:
        # Parse parameters
        params = BacktestParams(
            strategy_name=payload.get("strategy", "TickletAlpha"),
            symbol=payload.get("symbol", "BTCUSDT"),
            interval=payload.get("interval", "1h"),
            min_volume=float(payload.get("min_volume", 50000)),
            min_price_change_pct=float(payload.get("min_price_change_pct", 1)),
            max_signals=int(payload.get("max_signals", 100)),
            min_confidence_pct=float(payload.get("min_confidence", 30)),
            start_time=payload.get("start_time"),
            end_time=payload.get("end_time")
        )
        
        # Run backtest
        result = run_backtest(params)
        
        # Save result
        result_id = result["id"]
        result["ts"] = int(time.time())
        
        with open(os.path.join(BT_DIR, f"{result_id}.json"), "w") as f:
            json.dump(result, f, indent=2)
        
        # Return summary (without full trade list)
        summary = {k: v for k, v in result.items() if k != "trades"}
        summary["trade_count"] = len(result.get("trades", []))
        
        return {
            "id": result_id,
            "summary": summary,
            "status": "completed"
        }
        
    except Exception as e:
        print(f"Backtest error: {e}")
        return {
            "error": str(e),
            "status": "failed"
        }

@router.get("/result/{result_id}")
def get_backtest_result(result_id: str) -> Dict[str, Any]:
    """Get full backtest result including all trades"""
    result_path = os.path.join(BT_DIR, f"{result_id}.json")
    
    if not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail="Backtest result not found")
    
    try:
        with open(result_path, "r") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading result: {e}")

@router.get("/results")
def list_backtest_results() -> Dict[str, Any]:
    """List all available backtest results"""
    try:
        results = []
        for filename in os.listdir(BT_DIR):
            if filename.endswith(".json"):
                result_path = os.path.join(BT_DIR, filename)
                try:
                    with open(result_path, "r") as f:
                        result = json.load(f)
                        # Include only summary info
                        summary = {
                            "id": result.get("id"),
                            "strategy": result.get("strategy"),
                            "symbol": result.get("symbol"),
                            "interval": result.get("interval"),
                            "executed": result.get("executed", 0),
                            "win_rate": result.get("win_rate", 0),
                            "pnl_pct": result.get("pnl_pct", 0),
                            "timestamp": result.get("timestamp", 0)
                        }
                        results.append(summary)
                except Exception as e:
                    print(f"Error reading result {filename}: {e}")
                    continue
        
        # Sort by timestamp, newest first
        results.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        
        return {"results": results}
        
    except Exception as e:
        return {"error": str(e), "results": []}

# Legacy endpoint for compatibility
@router.get("/run")
def run_legacy(symbol: str = Query("BTCUSDT"), interval: str = Query("1h"), bars: int = Query(500)):
    """Legacy backtest endpoint for backward compatibility"""
    payload = {
        "strategy": "TickletAlpha",
        "symbol": symbol,
        "interval": interval,
        "max_signals": min(bars, 100)
    }
    return run_backtest_endpoint(payload)