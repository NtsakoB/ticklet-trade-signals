"""
Playwright test for /api/signals endpoints
Tests the unified signals API to ensure it responds correctly to different signal types.
"""

import asyncio
import httpx
import pytest

# Base URL for the API (adjust as needed for your environment)
BASE_URL = "http://localhost:8000"

async def test_api_signals_types():
    """Test that /api/signals endpoint responds correctly for different signal types"""
    
    signal_types = ["active", "recent", "missed", "lowest", "trade", "low_entry", "low_price"]
    
    async with httpx.AsyncClient() as client:
        for signal_type in signal_types:
            url = f"{BASE_URL}/api/signals?type={signal_type}"
            response = await client.get(url)
            
            # Should return 200 OK and valid JSON
            assert response.status_code == 200, f"Failed for signal type '{signal_type}': {response.status_code}"
            
            # Response should be a list (empty list is fine for this test)
            data = response.json()
            assert isinstance(data, list), f"Expected list response for signal type '{signal_type}', got {type(data)}"
            
            print(f"✓ Signal type '{signal_type}' returned {len(data)} items")

async def test_api_missed_opportunities_redirect():
    """Test that /api/missed-opportunities returns 307 redirect"""
    
    async with httpx.AsyncClient(follow_redirects=False) as client:
        response = await client.get(f"{BASE_URL}/api/missed-opportunities")
        
        # Should return 307 redirect
        assert response.status_code == 307, f"Expected 307 redirect, got {response.status_code}"
        
        # Should redirect to /api/signals?type=missed
        location = response.headers.get("location")
        assert location == "/api/signals?type=missed", f"Expected redirect to '/api/signals?type=missed', got '{location}'"
        
        print("✓ /api/missed-opportunities correctly returns 307 redirect")

async def test_api_lowest_price_compatibility():
    """Test that /api/lowest-price returns compatibility response"""
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/lowest-price")
        
        # Should return 200 OK
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        
        # Should return JSON with expected structure
        data = response.json()
        assert "items" in data, "Response should contain 'items' field"
        assert "message" in data, "Response should contain 'message' field"
        assert "status" in data, "Response should contain 'status' field"
        assert data["status"] == "ok", "Status should be 'ok'"
        
        print("✓ /api/lowest-price returns compatibility response")

# Run the tests if this file is executed directly
if __name__ == "__main__":
    async def run_tests():
        print("Running API signals tests...")
        await test_api_signals_types()
        await test_api_missed_opportunities_redirect()
        await test_api_lowest_price_compatibility()
        print("All tests passed!")
    
    asyncio.run(run_tests())