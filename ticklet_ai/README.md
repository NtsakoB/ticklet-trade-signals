# Ticklet AI Microservice

This is the AI-powered microservice for the Ticklet Trading Bot system.

## Overview

The Ticklet AI service provides:
- AI-powered signal scoring and confidence analysis
- Machine learning model training (RandomForest, XGBoost, Logistic Regression)
- Learning curve analytics and performance tracking
- GPT-powered chat interface for trading insights
- Daily automation and scheduled tasks

## Architecture

- **FastAPI** - Modern async web framework
- **Python 3.9+** - Runtime environment
- **Uvicorn** - ASGI server
- **Supabase** - Database and authentication
- **OpenAI** - GPT chat functionality

## Deployment

This service is designed to be deployed on Render using Docker:

1. Set environment variables in Render dashboard
2. Deploy using Docker method
3. The service will automatically build and start

## Environment Variables

Required environment variables (see `.env.example`):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `OPENAI_API_KEY` - OpenAI API key for GPT features

## API Endpoints

- `GET /` - Health check
- `POST /score/signal` - Score trading signals with AI
- `POST /score/learn` - Update model with feedback
- `GET /summary/daily` - Get daily performance summary
- `POST /feedback/log` - Log trading feedback
- `POST /chat/` - GPT chat interface

## Local Development

1. Copy `.env.example` to `.env` and fill in values
2. Install dependencies: `pip install -r requirements.txt`
3. Run locally: `uvicorn app.main:app --reload`

## Docker Deployment

A Dockerfile will be provided for containerized deployment with all dependencies included.