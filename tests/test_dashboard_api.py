"""
Tests for the dashboard summary API endpoint
"""
import pytest
from fastapi.testclient import TestClient
from ticklet_ai.app.main import app

client = TestClient(app)


def test_dashboard_summary_endpoint():
    """Test that the dashboard summary endpoint returns expected data structure"""
    response = client.get("/api/summary/dashboard")
    assert response.status_code == 200
    
    data = response.json()
    
    # Check that all required fields are present
    assert "active_signals" in data
    assert "executed_trades" in data
    assert "win_rate" in data
    assert "capital_at_risk" in data
    assert "data_source" in data
    
    # Check that fields have expected types
    assert isinstance(data["active_signals"], int)
    assert isinstance(data["executed_trades"], int)
    assert isinstance(data["win_rate"], (int, float))
    assert isinstance(data["capital_at_risk"], (int, float))
    assert isinstance(data["data_source"], str)
    
    # Check that values are reasonable
    assert data["active_signals"] >= 0
    assert data["executed_trades"] >= 0
    assert 0 <= data["win_rate"] <= 1
    assert data["capital_at_risk"] >= 0


def test_signals_endpoint_active():
    """Test that the active signals endpoint returns proper data"""
    response = client.get("/api/signals?type=active")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    
    if len(data) > 0:
        signal = data[0]
        assert "id" in signal
        assert "symbol" in signal
        assert "confidence" in signal
        assert "price" in signal
        assert signal["id"].startswith("active_")


def test_signals_endpoint_recent():
    """Test that the recent signals endpoint returns proper data"""
    response = client.get("/api/signals?type=recent")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)


def test_signals_endpoint_lowest():
    """Test that the lowest signals endpoint returns proper data"""
    response = client.get("/api/signals?type=lowest")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)


def test_signals_endpoint_missed():
    """Test that the missed signals endpoint returns proper data"""
    response = client.get("/api/signals?type=missed")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)


def test_signals_endpoint_invalid_type():
    """Test that invalid signal types return 422"""
    response = client.get("/api/signals?type=invalid")
    assert response.status_code == 422


def test_backward_compatibility_endpoint():
    """Test that the backward compatibility endpoint works"""
    response = client.get("/api/signals/compat?type=trade")
    assert response.status_code == 200
    
    data = response.json()
    assert isinstance(data, list)
    
    # Should be equivalent to active signals
    response_active = client.get("/api/signals?type=active")
    active_data = response_active.json()
    
    # Both should return same length (assuming deterministic fallback data)
    assert len(data) == len(active_data)