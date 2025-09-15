import os, logging
from pathlib import Path
logger = logging.getLogger(__name__)
_DEF_TMP = Path("/tmp/ticklet_data")

def resolve_data_dir() -> Path:
    if (p := os.environ.get("DATA_DIR")):
        return Path(p)
    if Path("/var/data").exists():
        return Path("/var/data")
    if os.environ.get("RENDER") or os.environ.get("RAILWAY") or os.environ.get("HEROKU"):
        return _DEF_TMP
    return Path("./data")

DATA_DIR = resolve_data_dir()
LOGS_DIR = DATA_DIR / "logs"
CACHE_DIR = DATA_DIR / "cache"

def ensure_dirs():
    global DATA_DIR, LOGS_DIR, CACHE_DIR
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("DATA_DIR=%s (logs=%s cache=%s)", DATA_DIR, LOGS_DIR, CACHE_DIR)
    except PermissionError:
        # fallback to tmp if the chosen path isn't writable
        DATA_DIR = _DEF_TMP
        LOGS_DIR = DATA_DIR / "logs"
        CACHE_DIR = DATA_DIR / "cache"
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.warning("Permission denied; falling back to %s", DATA_DIR)

ensure_dirs()