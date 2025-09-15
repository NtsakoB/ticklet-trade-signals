import os, logging, csv, pathlib
from datetime import datetime, timezone
from supabase import create_client, Client
logger = logging.getLogger(__name__)
URL = os.getenv('SUPABASE_URL')
SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
supa: Client = create_client(URL, SERVICE_KEY)
DATA_DIR = pathlib.Path(os.getenv('DATA_DIR','/data/logs'))
DATA_DIR.mkdir(parents=True, exist_ok=True)

def _insert(table: str, rows):
    try:
        supa.table(table).insert(rows).execute()
    except Exception as e:
        logger.warning(f'Supabase insert failed for {table}: {e}')

def store_signals_batch(signals: list[dict]):
    if not signals: return
    ts = datetime.now(timezone.utc).isoformat()
    payload = [s | {'ts': ts} for s in signals]
    _insert('signals', payload)
    write_csv(DATA_DIR / 'signals.csv', payload)

def store_scan_summary(summary: dict):
    row = summary | {'ts': datetime.now(timezone.utc).isoformat()}
    _insert('scans', row)
    write_csv(DATA_DIR / 'scans.csv', [row])

def write_csv(path: pathlib.Path, rows: list[dict]):
    if not rows: return
    headers = sorted(rows[0].keys())
    exists = path.exists()
    with path.open('a', newline='') as f:
        w = csv.DictWriter(f, fieldnames=headers)
        if not exists: w.writeheader()
        for r in rows: w.writerow(r)