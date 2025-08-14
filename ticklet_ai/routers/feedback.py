from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FB(BaseModel):
    text: str

@router.post("/log")
async def log_feedback(fb: FB):
    return {"ok": True}