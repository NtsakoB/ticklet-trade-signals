from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ticklet_ai.app.routes import telegram, chat, signals, feedback
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Ticklet AI Backend",
    description="Trading AI system with Telegram, OpenAI, and Supabase integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(telegram.router, prefix="/telegram", tags=["telegram"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(signals.router, prefix="/generate-signal", tags=["signals"])
app.include_router(feedback.router, prefix="/feedback", tags=["feedback"])

@app.get("/")
def root():
    """Health check endpoint"""
    return {"message": "Ticklet AI backend is live ✅", "status": "operational"}

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "Ticklet AI",
        "version": "1.0.0",
        "backend_url": os.getenv("BACKEND_URL", "not_set"),
        "environment": "production" if os.getenv("RENDER") else "development"
    }