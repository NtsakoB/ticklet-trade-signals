from fastapi import APIRouter, Body
from typing import Dict, Any
import json
import os

router = APIRouter(prefix="/api/settings", tags=["settings"])

# Alignment: adapt these imports/paths to your common data dir helper if it exists.
try:
    from ticklet_ai.utils.paths import DATA_DIR
except Exception:
    DATA_DIR = os.environ.get("TICKLET_DATA_DIR", "./data")

os.makedirs(DATA_DIR, exist_ok=True)
SETTINGS_FILE = os.path.join(DATA_DIR, "trading_settings.json")

DEFAULT = { "dynamic_leverage_enabled": True, "manual_leverage": 10 }

def load_settings() -> Dict[str, Any]:
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return DEFAULT.copy()

def save_settings(s: Dict[str, Any]) -> Dict[str, Any]:
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(s, f)
    except Exception:
        pass
    return s

@router.get("/trading")
def get_trading_settings() -> Dict[str, Any]:
    return load_settings()

@router.put("/trading")
def put_trading_settings(payload: Dict[str, Any] = Body(...)) -> Dict[str, Any]:
    s = load_settings()
    dyn = bool(payload.get("dynamic_leverage_enabled", s["dynamic_leverage_enabled"]))
    lev = int(payload.get("manual_leverage", s["manual_leverage"]))
    lev = max(1, min(20, lev))
    s = { "dynamic_leverage_enabled": dyn, "manual_leverage": lev }
    return save_settings(s)