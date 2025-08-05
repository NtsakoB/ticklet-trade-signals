# GPT Chat Interface
# /chat endpoint (chatbot)

from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/")
def chat_endpoint():
    return {"message": "GPT chat endpoint"}