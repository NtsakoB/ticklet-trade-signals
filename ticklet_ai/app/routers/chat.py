from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import httpx
from openai import OpenAI
from ticklet_ai.config import get_settings

router = APIRouter(tags=["chat"])

TOOLS: List[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_market_summary",
            "description": "Return a short market summary used in Ticklet UI.",
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {"type": "string", "description": "Symbol like BTCUSDT"},
                    "interval": {"type": "string", "description": "Timeframe like 1h"}
                },
                "required": ["symbol", "interval"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_open_positions",
            "description": "Return a compact list of open positions.",
            "parameters": {"type": "object", "properties": {}}
        }
    }
]

class ChatMessage(BaseModel):
    role: str = Field(..., description="system|user|assistant")
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    stream: bool = False
    model: Optional[str] = None
    tools: Optional[List[dict]] = None
    metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    output_text: str

def _client() -> OpenAI:
    s = get_settings()
    if not s.OPENAI_KEY:
        raise RuntimeError("OpenAI key missing. Set TICKLET_OPENAI_KEY or OPENAI_API_KEY.")
    return OpenAI(api_key=s.OPENAI_KEY)

@router.get("/health")
def health() -> Dict[str, Any]:
    """Lightweight health endpoint to verify wiring at runtime."""
    s = get_settings()
    return {
        "ok": bool(s.OPENAI_KEY),
        "model": s.OPENAI_MODEL,
        "has_key": bool(s.OPENAI_KEY),
    }

@router.post("/completions", response_model=ChatResponse)
async def completions(body: ChatRequest) -> ChatResponse:
    """
    Minimal wrapper around OpenAI chat completions API.
    Frontend posts messages; we return output_text.
    """
    s = get_settings()
    model = body.model or s.OPENAI_MODEL
    try:
        client = _client()

        # Convert messages to OpenAI format
        messages = []
        for m in body.messages:
            messages.append({"role": m.role, "content": m.content})

        # Add timeout and error handling
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            
            text = resp.choices[0].message.content
            if not text:
                raise RuntimeError("Empty response from model.")
                
            return ChatResponse(output_text=text.strip())
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Upstream connection error: {e}") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e