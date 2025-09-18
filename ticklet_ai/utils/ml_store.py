import json, datetime
from pathlib import Path
from typing import Any, Dict
from .paths import CURVES_DIR

def _path(name: str) -> Path:
    return CURVES_DIR / f"{name}.json"

def save_json(path: Path, obj: Any):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2))

def load_json(path: Path, default=None):
    if path.exists():
        return json.loads(path.read_text())
    return default

def add_curve_point(name: str, point: Dict):
    path = _path(name)
    data = load_json(path, {"series": []})
    data["series"].append({"ts": datetime.datetime.utcnow().isoformat() + "Z", **point})
    save_json(path, data)

def get_curve(name: str) -> Dict:
    return load_json(_path(name), {"series": []})