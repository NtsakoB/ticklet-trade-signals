# chat_api.py – FastAPI backend routes for TickletAI Assistant

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import logging
from openai import OpenAI

# Setup logging
logging.basicConfig(level=logging.INFO)

router = APIRouter(prefix="/api/chat", tags=["chat"])

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = os.getenv("OPENAI_MODEL", "gpt-4.1-2025-04-14")

# Mock persistent store (replace with Supabase/PostgreSQL)
chat_log_db = []
learning_db = []

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: List[Message] = []

class SaveRequest(BaseModel):
    conversation: List[Message]

class LearnRequest(BaseModel):
    instruction: str
    context: List[Message]
    response: str

@router.post("/")
async def chat(req: ChatRequest):
    """
    Process chat message and return AI response with context awareness.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        # Prepare messages for OpenAI API
        messages = [
            {"role": "system", "content": "You are TickletAI Assistant, a helpful trading and cryptocurrency analysis AI. Provide concise, actionable insights."}
        ]
        
        # Add recent context (last 5 messages)
        for msg in req.context[-5:]:
            messages.append({"role": msg.role, "content": msg.content})
        
        # Add current user message
        messages.append({"role": "user", "content": req.message})
        
        logging.info(f"Sending chat request with {len(messages)} messages")
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content
        logging.info(f"Received response: {reply[:100]}...")
        
        return {"reply": reply.strip()}

    except Exception as e:
        logging.error(f"Chat error: {str(e)}")
        return {"reply": f"⚠️ AI service temporarily unavailable. Please try again."}

@router.post("/save")
async def save_conversation(req: SaveRequest):
    """
    Save conversation to persistent storage for chat history.
    """
    try:
        chat_entry = {
            "id": len(chat_log_db) + 1,
            "timestamp": datetime.utcnow().isoformat(),
            "conversation": [msg.dict() for msg in req.conversation],
            "message_count": len(req.conversation)
        }
        
        chat_log_db.append(chat_entry)
        logging.info(f"Saved conversation with {len(req.conversation)} messages")
        
        return {"status": "saved", "conversation_id": chat_entry["id"]}
    
    except Exception as e:
        logging.error(f"Save error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save conversation")

@router.post("/learn")
async def learn(req: LearnRequest):
    """
    Store interaction data for AI learning and improvement.
    """
    try:
        learning_entry = {
            "id": len(learning_db) + 1,
            "timestamp": datetime.utcnow().isoformat(),
            "instruction": req.instruction,
            "context_length": len(req.context),
            "response": req.response,
            "response_length": len(req.response)
        }
        
        learning_db.append(learning_entry)
        logging.info(f"Stored learning entry: {req.instruction[:50]}...")
        
        return {"status": "learned", "entry_id": learning_entry["id"]}
    
    except Exception as e:
        logging.error(f"Learning error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store learning data")

@router.get("/history")
async def get_chat_history(limit: int = 10):
    """
    Retrieve recent chat conversations for 'My Chats' tab.
    """
    try:
        # Return most recent conversations
        recent_chats = sorted(chat_log_db, key=lambda x: x["timestamp"], reverse=True)[:limit]
        
        return {
            "conversations": recent_chats,
            "total_count": len(chat_log_db)
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