from fastapi import APIRouter
from ticklet_ai.config import get_settings
import asyncpg
import os

router = APIRouter(tags=["health"])

@router.get("/chat")
async def chat_health():
    """Verify that OpenAI key is loaded at runtime."""
    s = get_settings()
    return {
        "ok": bool(getattr(s, 'OPENAI_API_KEY', None) or getattr(s, 'OPENAI_KEY', None)),
        "model": getattr(s, 'OPENAI_MODEL', 'gpt-4o-mini'),
        "has_key": bool(getattr(s, 'OPENAI_API_KEY', None) or getattr(s, 'OPENAI_KEY', None)),
    }

@router.get("/db")
async def db_health():
    """Verify that asyncpg can connect to Postgres."""
    try:
        conn_str = os.getenv("DATABASE_URL")
        if not conn_str:
            return {"ok": False, "error": "DATABASE_URL missing"}
        conn = await asyncpg.connect(conn_str)
        await conn.close()
        return {"ok": True, "message": "Connected to Postgres successfully"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@router.get("/")
async def root_health():
    """Summary of system health (OpenAI + DB)."""
    s = get_settings()
    out = {"chat_ok": bool(getattr(s, 'OPENAI_API_KEY', None) or getattr(s, 'OPENAI_KEY', None))}
    try:
        conn_str = os.getenv("DATABASE_URL")
        if conn_str:
            conn = await asyncpg.connect(conn_str)
            await conn.close()
            out["db_ok"] = True
        else:
            out["db_ok"] = False
    except Exception:
        out["db_ok"] = False
    return out