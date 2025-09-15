import os, logging, csv
from pathlib import Path
from datetime import datetime, timezone
from supabase import create_client, Client
from ticklet_ai.config import settings
from ticklet_ai.utils.paths import DATA_DIR, LOGS_DIR
logger = logging.getLogger(__name__)
URL = settings.SUPABASE_URL
SERVICE_KEY = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

if not URL or not SERVICE_KEY:
    raise RuntimeError('Set TICKLET_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')

supa: Client = create_client(URL, SERVICE_KEY)
CSV_DIR = DATA_DIR / 'logs'
CSV_DIR.mkdir(parents=True, exist_ok=True)

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
    write_csv(CSV_DIR / 'signals.csv', payload)

def store_scan_summary(summary: dict):
    row = summary | {'ts': datetime.now(timezone.utc).isoformat()}
    _insert('scans', row)
    write_csv(CSV_DIR / 'scans.csv', [row])

def write_csv(path: Path, rows: list[dict]):
    if not rows: return
    headers = sorted(rows[0].keys())
    exists = path.exists()
    with path.open('a', newline='') as f:
        w = csv.DictWriter(f, fieldnames=headers)
        if not exists: w.writeheader()
        for r in rows: w.writerow(r)