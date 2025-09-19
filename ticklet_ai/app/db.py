import os, asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        dsn = os.getenv("SUPABASE_DB_URI") or os.getenv("DATABASE_URL")
        if not dsn:
            raise RuntimeError("SUPABASE_DB_URI/DATABASE_URL not set")
        _pool = await asyncpg.create_pool(dsn=dsn, min_size=1, max_size=5)
    return _pool