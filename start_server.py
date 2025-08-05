#!/usr/bin/env python3
"""
Ticklet AI Server Startup Script
Starts the FastAPI application with proper configuration
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 Starting Ticklet AI Server on {host}:{port}")
    print(f"📡 Backend URL: {os.getenv('BACKEND_URL', 'Not set')}")
    print(f"🤖 OpenAI configured: {'✅' if os.getenv('TICKLET_OPENAI_KEY') else '❌'}")
    print(f"🗄️  Supabase configured: {'✅' if os.getenv('TICKLET_SUPABASE_URL') else '❌'}")
    print(f"📱 Telegram configured: {'✅' if os.getenv('TELEGRAM_BOT_TOKEN') else '❌'}")
    
    # Start server
    uvicorn.run(
        "ticklet_ai.app.main:app",
        host=host,
        port=port,
        reload=False,  # Set to True for development
        log_level="info"
    )