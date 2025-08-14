from fastapi import APIRouter
from pydantic import BaseModel
import os
from openai import OpenAI

router = APIRouter(prefix="/chat", tags=["chat"])

MODEL = os.getenv("TICKLET_OPENAI_MODEL","gpt-4o-mini")
KEY   = os.getenv("TICKLET_OPENAI_KEY") or os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=KEY) if KEY else None

class Msg(BaseModel):
    message: str

@router.post("")
async def chat(m: Msg):
    if not client:
        return {"reply": "AI disabled: missing API key"}
    
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role":"system","content":"You are Ticklet's trading assistant."},
                  {"role":"user","content":m.message}]
    )
    return {"reply": resp.choices[0].message.content}