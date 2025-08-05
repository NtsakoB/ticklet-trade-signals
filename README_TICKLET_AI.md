# Ticklet AI Backend System

🧠 **Complete FastAPI trading AI backend with Telegram, OpenAI, and Supabase integration**

## 🚀 Quick Start

### 1. Environment Setup
Copy environment variables from `.env.example`:

```bash
# Backend Configuration
BACKEND_URL=https://your-app.onrender.com

# OpenAI Configuration  
TICKLET_OPENAI_KEY=your_openai_api_key_here

# Supabase Configuration
TICKLET_SUPABASE_URL=your_supabase_url_here
TICKLET_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID_TRADING=your_trading_chat_id_here
TELEGRAM_CHAT_ID_MAINTENANCE=your_maintenance_chat_id_here
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start Server
```bash
# Method 1: Direct uvicorn (Render deployment)
uvicorn ticklet_ai.app.main:app --host 0.0.0.0 --port 8000

# Method 2: Using startup script (local development)
python start_server.py
```

### 4. Test System
```bash
python scripts/test_system_integrity.py
```

## 📁 Project Structure

```
ticklet_ai/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── routes/
│   │   ├── telegram.py         # Telegram webhook & messaging
│   │   ├── chat.py             # OpenAI chat integration
│   │   ├── signals.py          # Trading signal generation
│   │   └── feedback.py         # Logging & feedback system
│   └── __init__.py
├── routers/                    # Legacy routers (preserved)
├── services/                   # AI & ML services
├── strategies/                 # Trading strategies
└── utils/                      # Utility functions

scripts/
├── test_system_integrity.py    # Full system diagnostic
start_server.py                 # Development server launcher
requirements.txt                # Python dependencies
.env.example                    # Environment template
```

## 🔌 API Endpoints

### Core Endpoints
- `GET /` - Health check
- `GET /health` - Detailed system status

### Telegram Integration
- `POST /telegram/send-signal` - Send trading signals
- `GET /telegram/test` - Test bot connection

### AI Chat System
- `POST /chat/` - Chat with OpenAI GPT
- `GET /chat/test` - Test OpenAI connection

### Signal Generation
- `POST /generate-signal/` - Generate trading signals
- `POST /generate-signal/validate` - Validate signal parameters
- `GET /generate-signal/test` - Test signal generator

### Feedback & Logging
- `POST /feedback/log` - Log system events
- `POST /feedback/signal-outcome` - Log signal outcomes
- `GET /feedback/test` - Test Supabase connection

## 🧪 System Testing

Run the comprehensive diagnostic:

```bash
python scripts/test_system_integrity.py
```

**Tests performed:**
- ✅ FastAPI server availability
- ✅ OpenAI API key validation
- ✅ Supabase database connection
- ✅ Telegram bot authentication
- ✅ Message delivery to both channels
- ✅ All API endpoint health checks

## 🚀 Render Deployment

**Start Command:**
```bash
uvicorn ticklet_ai.app.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables Required:**
- `TICKLET_OPENAI_KEY`
- `TICKLET_SUPABASE_URL`
- `TICKLET_SUPABASE_ANON_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID_TRADING`
- `TELEGRAM_CHAT_ID_MAINTENANCE`
- `BACKEND_URL` (auto-set by Render)

## 📱 Usage Examples

### Send Telegram Signal
```python
import requests

data = {
    "text": "🚀 BUY SIGNAL: BTCUSDT at $45,000",
    "channel": "trading"
}
response = requests.post(f"{API_URL}/telegram/send-signal", json=data)
```

### Chat with AI
```python
data = {
    "messages": [
        {"role": "user", "content": "Analyze BTCUSDT market conditions"}
    ]
}
response = requests.post(f"{API_URL}/chat/", json=data)
```

### Generate Trading Signal
```python
data = {
    "symbol": "BTCUSDT",
    "action": "BUY",
    "price": 45000.0,
    "confidence": 0.85
}
response = requests.post(f"{API_URL}/generate-signal/", json=data)
```

## 🔧 Development

For local development:
1. Set up environment variables
2. Run `python start_server.py`
3. Access API docs at `http://localhost:8000/docs`

## 📊 Monitoring

- **Health Check:** `GET /health`
- **System Diagnostics:** `python scripts/test_system_integrity.py`
- **Logs:** Check Render deployment logs or local console output