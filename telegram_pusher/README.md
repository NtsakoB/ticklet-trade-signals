# Ticklet Telegram_Pusher — Fault-Tolerant Telegram Forwarder

## Overview

Telegram_Pusher is a small, fault-tolerant microservice that receives signed payloads from a FastAPI Notifier and forwards messages (and optional images) to two Telegram channels: **Signals** and **Maintenance**. It exposes a single `/push` endpoint, enforces HMAC authentication, idempotency, retries with exponential backoff, and exports health/metrics endpoints.

- Language: Python 3.11
- Framework: FastAPI
- HTTP client: httpx
- Logging: structlog (JSON logs)
- Metrics: Prometheus
- Run: uvicorn
- Packaging: Docker

## Quickstart

```sh
cp .env.example .env
# Edit .env with your TELEGRAM_BOT_TOKEN and channel chat IDs
docker compose up --build
open http://localhost:8001/healthz
