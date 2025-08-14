from fastapi import APIRouter
from pydantic import BaseModel
from ticklet_ai.services.notifier import send_trade

router = APIRouter(prefix="/telegram", tags=["telegram"])

class Sig(BaseModel):
    text: str
    image_url: str | None = None

@router.post("/send-signal")
async def send_signal(s: Sig):
    send_trade(s.text, s.image_url)
    return {"ok": True}