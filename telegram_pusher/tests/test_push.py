import os
import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from app.main import app

@pytest.mark.asyncio
async def test_healthz():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/healthz")
        assert response.status_code == 200
        assert response.text == "ok"
