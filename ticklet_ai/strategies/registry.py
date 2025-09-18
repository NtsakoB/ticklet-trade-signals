"""
Central strategy registry + per-strategy universe.
NOTE: Map these adapters to your repo's actual functions; do not rename your originals.
"""
from typing import Dict, Callable, Any, List, Optional

# ---- Import actual strategy evaluators (adjust paths if needed) ----
# Ticklet Alpha
try:
    from ticklet.strategies.ticklet_alpha import evaluate_smart_signal as alpha_eval
except Exception:
    alpha_eval = None

# Golden Hook
try:
    from ticklet.strategies.golden_hook import evaluate as gh_eval
except Exception:
    gh_eval = None

# Market Regime
try:
    from ticklet.strategies.market_regime import evaluate as regime_eval
except Exception:
    regime_eval = None

StrategyFn = Callable[..., Dict[str, Any]]

# ---- Adapters (map arguments to your functions) ----
def _wrap_alpha(symbol: str, timeframe: str) -> Dict[str, Any]:
    if alpha_eval is None:
        return {"status":"error","reason":"alpha_eval not found"}
    return alpha_eval(symbol=symbol, timeframe=timeframe)

def _wrap_gh(symbol: str, timeframe: str) -> Dict[str, Any]:
    if gh_eval is None:
        return {"status":"error","reason":"gh_eval not found"}
    return gh_eval(symbol=symbol, timeframe=timeframe)

def _wrap_regime(symbol: str, timeframe: str) -> Dict[str, Any]:
    if regime_eval is None:
        return {"status":"error","reason":"regime_eval not found"}
    return regime_eval(symbol=symbol, timeframe=timeframe)

# ---- Registry ----
STRATEGIES: Dict[str, StrategyFn] = {
    "TickletAlpha": _wrap_alpha,
    "GoldenHook": _wrap_gh,
    "MarketRegime": _wrap_regime,
}

# Optional per-strategy defaults (can be "auto" to defer to universe)
STRATEGY_CONFIG = {
    "TickletAlpha": {
        "symbols": "auto",         # or list e.g. ["BTCUSDT","ETHUSDT"]
        "timeframes": ["15m","30m","1h","1d"]
    },
    "GoldenHook": {
        "symbols": "auto",
        "timeframes": ["15m","1h","1d"]
    },
    "MarketRegime": {
        "symbols": "auto",
        "timeframes": ["1h","1d"]
    },
}

def list_strategies() -> List[str]:
    return list(STRATEGIES.keys())

def run_strategy(name: str, symbol: str, timeframe: str) -> Dict[str, Any]:
    fn = STRATEGIES.get(name)
    if not fn:
        return {"status":"error","reason":f"strategy {name} not found"}
    try:
        res = fn(symbol, timeframe)
        return res if isinstance(res, dict) else {"status":"error","reason":"non-dict result"}
    except Exception as e:
        return {"status":"error","reason":f"{e.__class__.__name__}: {e}"}

def get_strategy_symbols(name: str) -> Optional[List[str]]:
    cfg = STRATEGY_CONFIG.get(name, {})
    sy = cfg.get("symbols")
    if isinstance(sy, list):
        return sy
    # "auto" -> defer to universe
    return None

def get_strategy_timeframes(name: str) -> Optional[List[str]]:
    cfg = STRATEGY_CONFIG.get(name, {})
    tfs = cfg.get("timeframes")
    if isinstance(tfs, list) and tfs:
        return tfs
    return None