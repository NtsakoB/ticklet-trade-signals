# Helper used by execution/backtesting to decide leverage
# If dynamic flag is OFF, return manual leverage (global).
# If dynamic flag is ON, caller should apply per-strategy logic.
import json, os
try:
    from ticklet_ai.utils.paths import DATA_DIR
except Exception:
    DATA_DIR = os.environ.get("TICKLET_DATA_DIR", "./data")
SETTINGS_FILE = os.path.join(DATA_DIR, "trading_settings.json")

def resolve_leverage(default_dynamic_value: int) -> int:
    try:
        with open(SETTINGS_FILE, "r") as f:
            s = json.load(f)
        if not s.get("dynamic_leverage_enabled", True):
            return int(s.get("manual_leverage", 10))
    except Exception:
        pass
    return int(default_dynamic_value)