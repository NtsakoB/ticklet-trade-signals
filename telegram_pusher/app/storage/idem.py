import sqlite3
import time
import threading

class IdempotencyStore:
    def __init__(self, db_path="idempotency.sqlite", ttl_days=7):
        self.ttl_seconds = ttl_days * 86400
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.lock = threading.Lock()
        self._init_db()

    def _init_db(self):
        with self.lock:
            self.conn.execute(
                "CREATE TABLE IF NOT EXISTS idempotency (key TEXT PRIMARY KEY, value TEXT, ts INTEGER)"
            )
            self.conn.commit()

    def get(self, key):
        with self.lock:
            cur = self.conn.execute(
                "SELECT value, ts FROM idempotency WHERE key=?", (key,)
            )
            row = cur.fetchone()
            if row and time.time() - row[1] < self.ttl_seconds:
                return row[0]
            return None

    def set(self, key, value):
        with self.lock:
            self.conn.execute(
                "INSERT OR REPLACE INTO idempotency (key, value, ts) VALUES (?, ?, ?)",
                (key, value, int(time.time())),
            )
            self.conn.commit()
