from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
import uuid, os

router = APIRouter(prefix="/api", tags=["chat"])
legacy_router = APIRouter(prefix="", tags=["chat-legacy"])

class ChatSessionIn(BaseModel):
    title: str | None = None

def _sb():
    try:
        from supabase import create_client
        url = os.environ.get("TICKLET_SUPABASE_URL")
        key = os.environ.get("TICKLET_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("TICKLET_SUPABASE_ANON_KEY")
        if url and key:
            return create_client(url, key)
    except Exception:
        pass
    return None

def _store_session(session_id: str, title: str, created_at: str):
    sb = _sb()
    if not sb:
        return
    try:
        sb.table("chat_sessions").insert({
            "id": session_id,
            "title": title,
            "created_at": created_at
        }).execute()
    except Exception:
        # non-fatal if table not present
        pass

@router.post("/chat/session")
def create_chat_session(body: ChatSessionIn):
    sid = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    _store_session(sid, body.title or "Session", now)
    return {"id": sid, "title": body.title or "Session", "created_at": now}

@legacy_router.post("/chat/session")
def create_chat_session_legacy(body: ChatSessionIn):
    return create_chat_session(body)