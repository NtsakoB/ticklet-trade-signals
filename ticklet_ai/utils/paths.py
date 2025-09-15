import os, logging
from pathlib import Path
logger = logging.getLogger(__name__)

_DEF_TMP = Path('/tmp/ticklet_data')

def resolve_data_dir() -> Path:
    # 1) explicit env
    if (p := os.environ.get('DATA_DIR')):
        return Path(p)
    # 2) common mount for Render Disks if you choose to attach one
    if Path('/var/data').exists():
        return Path('/var/data')
    # 3) PaaS-friendly tmp
    if os.environ.get('RENDER') or os.environ.get('RAILWAY') or os.environ.get('HEROKU'):
        return _DEF_TMP
    # 4) local dev fallback
    return Path('./data')

# Initialize folders and provide handy paths
DATA_DIR = resolve_data_dir()
LOGS_DIR = DATA_DIR / 'logs'
CACHE_DIR = DATA_DIR / 'cache'

def ensure_dirs():
    global DATA_DIR, LOGS_DIR, CACHE_DIR
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.info('DATA_DIR=%s (logs=%s cache=%s)', DATA_DIR, LOGS_DIR, CACHE_DIR)
    except PermissionError:
        # last-resort: fall back to /tmp if chosen path is not writable
        DATA_DIR = _DEF_TMP
        LOGS_DIR = DATA_DIR / 'logs'
        CACHE_DIR = DATA_DIR / 'cache'
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        logger.warning('Permission denied; falling back to %s', DATA_DIR)

ensure_dirs()