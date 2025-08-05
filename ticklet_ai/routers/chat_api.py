# chat_api.py – FastAPI backend routes with strategy-awareness for TickletAI

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
import logging
from openai import OpenAI

# FastAPI router for TickletAI Assistant
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Setup logging
logging.basicConfig(level=logging.INFO)

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")

# Mock persistent store (replace with Supabase/PostgreSQL in production)
chat_log_db = []
learning_db = []

# Pydantic models for input validation
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's input message.")
    strategy: str = Field(default="ecosystem", description="Selected trading strategy for context.")
    context: List[Message] = Field(default=[], description="List of prior conversation messages.")

class SaveRequest(BaseModel):
    conversation: List[Message]
    strategy: str = Field(default="ecosystem", description="Strategy used for this conversation.")

class LearnRequest(BaseModel):
    instruction: str
    strategy: str = Field(default="ecosystem", description="Strategy used for this interaction.")
    context: List[Message]
    response: str

@router.post("/")
async def chat(req: ChatRequest):
    """
    Handles user chat requests and interacts with GPT-4.
    """
    if not os.getenv("OPENAI_API_KEY"):
        logging.error("OpenAI API key not configured")
        return {"reply": "⚠️ AI service not configured. Please try again."}
    
    try:
        # Limit context to the last 5 messages
        messages = [{"role": m.role, "content": m.content} for m in req.context[-5:]]
        
        # Add strategy context to the system message
        strategy_context = f"You are responding from the perspective of the '{req.strategy}' trading strategy. Provide insights and analysis relevant to this specific approach."
        messages.insert(0, {"role": "system", "content": strategy_context})
        messages.append({"role": "user", "content": req.message})

        # Interact with OpenAI's GPT-4 model
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=500,
            timeout=10  # Timeout in seconds
        )
        reply = response.choices[0].message.content
        logging.info(f"AI reply: {reply.strip()}")
        return {"reply": reply.strip()}

    except Exception as e:
        # Log and return error message
        logging.error(f"Error in /api/chat: {str(e)}")
        return {"reply": f"⚠️ AI error: {str(e)}"}

@router.post("/save")
async def save_conversation(req: SaveRequest):
    """
    Saves a conversation to the chat log.
    """
    try:
        chat_log_db.append({
            "timestamp": datetime.utcnow().isoformat(),
            "strategy": req.strategy,
            "conversation": req.conversation
        })
        logging.info("Conversation saved.")
        return {"status": "saved"}
    except Exception as e:
        # Log and return error message
        logging.error(f"Error in /api/chat/save: {str(e)}")
        return {"status": f"error: {str(e)}"}

@router.post("/learn")
async def learn(req: LearnRequest):
    """
    Saves learning instructions and responses.
    """
    try:
        learning_db.append({
            "timestamp": datetime.utcnow().isoformat(),
            "instruction": req.instruction,
            "strategy": req.strategy,
            "context": req.context,
            "response": req.response
        })
        logging.info("Learning instruction saved.")
        return {"status": "learned"}
    except Exception as e:
        # Log and return error message
        logging.error(f"Error in /api/chat/learn: {str(e)}")
        return {"status": f"error: {str(e)}"}

@router.get("/history")
async def get_chat_history(strategy: Optional[str] = Query(None), limit: int = 10):
    """
    Retrieve chat conversations with optional strategy filtering for 'My Chats' tab.
    Supports strategy-aware ML feedback clustering and personalized coaching.
    """
    try:
        # Filter by strategy if provided
        filtered_chats = chat_log_db
        if strategy:
            filtered_chats = [log for log in chat_log_db if log.get("strategy") == strategy]
        
        # Return most recent conversations
        recent_chats = sorted(filtered_chats, key=lambda x: x["timestamp"], reverse=True)[:limit]
        
        return {
            "conversations": recent_chats,
            "total_count": len(filtered_chats),
            "strategy_filter": strategy
        }
    
    except Exception as e:
        logging.error(f"History error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve chat history")

@router.get("/stats")
async def get_chat_stats():
    """
    Get chat and learning statistics for analytics.
    """
    try:
        total_conversations = len(chat_log_db)
        total_learning_entries = len(learning_db)
        
        # Calculate total messages
        total_messages = sum(chat["message_count"] for chat in chat_log_db)
        
        return {
            "total_conversations": total_conversations,
            "total_messages": total_messages,
            "learning_entries": total_learning_entries,
            "avg_messages_per_conversation": total_messages / max(total_conversations, 1)
        }
    
    except Exception as e:
        logging.error(f"Stats error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")