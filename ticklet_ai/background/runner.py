import os, time
from apscheduler.schedulers.background import BackgroundScheduler
from ..strategies.registry import list_strategies, run_strategy, get_strategy_symbols, get_strategy_timeframes
from ..services.universe import explicit_env_symbols, default_auto_symbols
from ..storage.repo import upsert_signal, upsert_features, log_action
from ..services.features import build_from_result

def _env_timeframes() -> list[str]:
    raw = os.getenv("TICKLET_TIMEFRAMES","15m,30m,1h,1d")
    return [x.strip() for x in raw.split(",") if x.strip()]

def _now():
    return int(time.time())

def _resolve_symbols_for_strategy(sname: str) -> list[str]:
    # 1) Explicit env list?
    env_sy = explicit_env_symbols()
    if env_sy is not None:
        return env_sy
    # 2) Per-strategy configured list?
    st_sy = get_strategy_symbols(sname)
    if isinstance(st_sy, list) and st_sy:
        return st_sy
    # 3) Auto universe (Binance top USDT by volume)
    return default_auto_symbols()

def _resolve_tfs_for_strategy(sname: str) -> list[str]:
    st_tfs = get_strategy_timeframes(sname)
    return st_tfs or _env_timeframes()

def start():
    # Respect TICKLET_BG_ENABLED in user's order
    if os.getenv("TICKLET_BG_ENABLED","true").lower() not in ("1","true","yes","on"):
        return None

    interval = int(os.getenv("TICKLET_BG_INTERVAL_SEC","60"))
    sched = BackgroundScheduler(timezone="UTC")

    def tick():
        for sname in list_strategies():
            symbols = _resolve_symbols_for_strategy(sname)
            tfs = _resolve_tfs_for_strategy(sname)
            for sym in symbols:
                for tf in tfs:
                    result = run_strategy(sname, sym, tf)
                    ts = result.get("ts_utc") or _now()
                    sig = {
                      "ts_utc": ts,
                      "symbol": sym,
                      "timeframe": tf,
                      "strategy": sname,
                      "status": result.get("status","ok"),
                      "side": result.get("side") or result.get("signal") or "",
                      "entry_low": result.get("entry_low") or result.get("entry_range_low") or result.get("entry_low_price") or "",
                      "entry_high": result.get("entry_high") or result.get("entry_range_high") or result.get("entry_high_price") or "",
                      "stop": result.get("stop") or result.get("stop_loss") or "",
                      "tp1": result.get("tp1") or "",
                      "tp2": result.get("tp2") or "",
                      "tp3": result.get("tp3") or "",
                      "confidence": result.get("confidence") or result.get("ai_confidence") or "",
                      "anomaly": result.get("anomaly") or "",
                      "pump_conf": result.get("pump_confidence") or "",
                      "raw": result,
                    }
                    upsert_signal(sig)

                    feats = build_from_result(sym, tf, sname, result)
                    if not feats.get("ts_utc"):
                        feats["ts_utc"] = ts
                    upsert_features(feats)
                    
                    # Log background scan action
                    log_action("bg_scan", {"ts_utc": ts, "symbol": sym, "strategy": sname, "timeframe": tf})

    sched.add_job(tick, "interval", seconds=interval, id="ticklet_bg_scan", max_instances=1, coalesce=True, misfire_grace_time=30)
    sched.start()
    return sched