from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from ticklet_ai.app.db import get_pool
import datetime as dt

router = APIRouter(prefix="/api/chat", tags=["chat-store"])

class SessionCreate(BaseModel):
    title: Optional[str] = None
    meta: Optional[dict] = None

class SessionOut(BaseModel):
    id: str
    created_at: str
    ended_at: Optional[str]
    title: Optional[str]
    meta: Optional[dict]

class MessageOut(BaseModel):
    id: int
    created_at: str
    role: str
    content: str
    tool_name: Optional[str] = None
    extra: Optional[dict] = None

@router.post("/session", response_model=SessionOut)
async def create_session(body: SessionCreate):
    pool = await get_pool()
    async with pool.acquire() as con:
        row = await con.fetchrow(
            "insert into chat_sessions(title, meta) values($1, $2) returning id, created_at, ended_at, title, meta",
            body.title, body.meta or {}
        )
        return {
            "id": str(row["id"]),
            "created_at": row["created_at"].isoformat(),
            "ended_at": row["ended_at"].isoformat() if row["ended_at"] else None,
            "title": row["title"],
            "meta": row["meta"],
        }

@router.post("/session/{session_id}/end", response_model=SessionOut)
async def end_session(session_id: str):
    pool = await get_pool()
    async with pool.acquire() as con:
        row = await con.fetchrow(
            "update chat_sessions set ended_at = now() where id=$1 returning id, created_at, ended_at, title, meta",
            session_id
        )
        if not row:
            raise HTTPException(404, "Session not found")
        return {
            "id": str(row["id"]),
            "created_at": row["created_at"].isoformat(),
            "ended_at": row["ended_at"].isoformat() if row["ended_at"] else None,
            "title": row["title"],
            "meta": row["meta"],
        }

@router.get("/session", response_model=List[SessionOut])
async def list_sessions(limit: int = 100, offset: int = 0):
    pool = await get_pool()
    async with pool.acquire() as con:
        rows = await con.fetch(
            "select id, created_at, ended_at, title, meta from chat_sessions order by created_at desc limit $1 offset $2",
            limit, offset
        )
        return [{
            "id": str(r["id"]),
            "created_at": r["created_at"].isoformat(),
            "ended_at": r["ended_at"].isoformat() if r["ended_at"] else None,
            "title": r["title"],
            "meta": r["meta"],
        } for r in rows]

@router.get("/session/{session_id}/messages", response_model=List[MessageOut])
async def list_messages(session_id: str):
    pool = await get_pool()
    async with pool.acquire() as con:
        rows = await con.fetch(
            "select id, created_at, role, content, tool_name, extra from chat_messages where session_id=$1 order by created_at asc",
            session_id
        )
        return [{
            "id": r["id"],
            "created_at": r["created_at"].isoformat(),
            "role": r["role"],
            "content": r["content"],
            "tool_name": r["tool_name"],
            "extra": r["extra"],
        } for r in rows]

async def save_message(session_id: str, role: str, content: str, tool_name: str | None = None, extra: dict | None = None):
    pool = await get_pool()
    async with pool.acquire() as con:
        await con.execute(
            "insert into chat_messages(session_id, role, content, tool_name, extra) values($1,$2,$3,$4,$5)",
            session_id, role, content, tool_name, extra
        )