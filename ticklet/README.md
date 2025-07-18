# Ticklet Trading Bot - Backend

This is the backend service for the Ticklet Trading Bot, designed to run on [Render](https://render.com) using Python, TA-Lib, and Docker.

## Overview

The Ticklet Trading Bot backend handles:
- Trading signal generation and processing
- Market data analysis and anomaly detection
- Strategy execution and backtesting
- Integration with Binance API and Telegram notifications
- Real-time data processing and storage

## Technology Stack

- **Python** - Core backend language
- **TA-Lib** - Technical analysis library for trading indicators
- **Docker** - Containerization for consistent deployment
- **Supabase** - Database, authentication, and API key management
- **Render** - Cloud hosting platform

## Entry Point

`main.py` serves as the application entry point and orchestrates all backend services.

## Environment Configuration

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in your actual API keys and credentials

### Production Deployment
All sensitive credentials should be configured through:
- Render's Environment Variables dashboard (recommended for production)
- Or using a `.env` file (ensure it's properly secured)

Required environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for backend operations
- `TELEGRAM_BOT_TOKEN` - Telegram bot token for notifications
- `BINANCE_API_KEY` - Binance API key for trading operations
- `BINANCE_API_SECRET` - Binance API secret

## Render Deployment

### Docker Method (Recommended)

This backend is designed to be deployed on Render using the **Docker method**:

1. **Create a new Web Service** on Render
2. **Select "Docker"** as the environment
3. **Connect your repository** containing this backend code
4. **Set the Dockerfile path** to point to the Dockerfile in this directory
5. **Configure environment variables** in Render's dashboard
6. **Deploy** - Render will automatically build the Docker image with TA-Lib included

### Why Docker?

The Dockerfile ensures that TA-Lib (Technical Analysis Library) is properly compiled and installed, which can be complex to set up in standard Python environments. Docker provides a consistent, reproducible build environment.

## Architecture

```
ticklet/
├── main.py                 # Application entry point
├── strategies/            # Trading strategies
├── core/                  # Core trading logic
├── dashboard/             # API routes and components
├── data/                  # Data storage and logs
├── database/              # Database schemas
└── Dockerfile            # Docker build configuration
```

## Supabase Integration

The backend integrates with Supabase for:
- **Authentication** - User management and session handling
- **Database** - Signal storage, user profiles, and trading history
- **API Key Management** - Secure credential storage
- **Real-time Updates** - Live data synchronization with frontend

## Getting Started

1. Clone the repository
2. Set up environment variables
3. Install dependencies: `pip install -r requirements.txt`
4. Run locally: `python main.py`
5. For production: Deploy to Render using Docker method

## Support

For deployment issues or questions, refer to:
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TA-Lib Installation Guide](https://ta-lib.org/install/)