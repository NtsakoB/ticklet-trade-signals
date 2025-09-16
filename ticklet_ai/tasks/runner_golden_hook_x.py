"""
GHX background loop: ticks symbols, logs ML rows.
"""
import os, time, logging
from ticklet_ai.strategies.golden_hook_x import GoldenHookXController
from ticklet_ai.services.mexc_client import MexcClient

logger = logging.getLogger(__name__)

def comfort_floor(symbol: str) -> float | None:
    s = symbol.upper()
    if s.startswith("ETH"): return float(os.getenv("GHX_COMFORT_FLOOR_ETH","2000"))
    return None

def run(ctx, adapters):
    if os.getenv("GHX_ENABLED","true").lower() != "true":
        logger.info("GHX disabled; skipping.")
        return
    ghx = GoldenHookXController(ctx, MexcClient(adapters), comfort_floor)
    poll = int(os.getenv("GHX_POLL_SEC","30"))
    symbols = [s.strip() for s in os.getenv("GHX_SYMBOLS","ETHUSDT").split(",") if s.strip()]
    while True:
        for sym in symbols:
            try:
                ghx.tick(sym)
                if hasattr(ctx, "ml"):
                    ctx.ml.log_training_row(strategy="GHX", symbol=sym)
            except Exception as e:
                logger.exception(f"GHX tick error for {sym}: {e}")
        time.sleep(poll)