from pathlib import Path
import os

DATA_DIR = Path(os.getenv("TICKLET_DATA_DIR", "./data")).resolve()
MODELS_DIR = Path(os.getenv("TICKLET_MODELS_DIR", str(DATA_DIR / "models"))).resolve()
LOGS_DIR = Path(os.getenv("TICKLET_LOGS_DIR", str(DATA_DIR / "logs"))).resolve()
CURVES_DIR = DATA_DIR / "curves"

def ensure_dirs():
    for p in (DATA_DIR, MODELS_DIR, LOGS_DIR, CURVES_DIR):
        p.mkdir(parents=True, exist_ok=True)