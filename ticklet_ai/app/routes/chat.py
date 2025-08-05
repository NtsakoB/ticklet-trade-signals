from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import openai
import os
from typing import List, Optional

router = APIRouter()

# Configure OpenAI
openai.api_key = os.getenv("TICKLET_OPENAI_KEY")

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "gpt-4o-mini"
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    response: str
    model: str
    usage: dict

@router.post("/", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Chat with OpenAI GPT model"""
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Convert messages to OpenAI format
        openai_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Add system context for trading AI
        system_message = {
            "role": "system",
            "content": "You are Ticklet AI, a sophisticated trading assistant. Provide clear, actionable trading insights and analysis."
        }
        openai_messages.insert(0, system_message)
        
        # Make OpenAI API call
        response = openai.chat.completions.create(
            model=request.model,
            messages=openai_messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        return ChatResponse(
            response=response.choices[0].message.content,
            model=response.model,
            usage=response.usage.dict()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

@router.get("/test")
def test_openai():
    """Test OpenAI API connection"""
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        models = openai.models.list()
        return {
            "status": "connected",
            "available_models": len(models.data),
            "message": "OpenAI API is operational"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API connection failed: {str(e)}")