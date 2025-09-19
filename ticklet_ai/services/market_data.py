import requests
from typing import List, Dict, Any
import time

BINANCE_API_BASE = "https://api.binance.com/api/v3"

def get_klines(symbol: str, interval: str, limit: int = 1000, start_time: int = None, end_time: int = None) -> List[Dict[str, Any]]:
    """
    Fetch historical klines from Binance API
    Returns list of candles with OHLCV data
    """
    try:
        url = f"{BINANCE_API_BASE}/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": min(limit, 1000)  # Binance limit
        }
        
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
            
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        raw_klines = response.json()
        
        # Convert to standardized format
        klines = []
        for kline in raw_klines:
            klines.append({
                "time": int(kline[0]),
                "open": float(kline[1]),
                "high": float(kline[2]),
                "low": float(kline[3]),
                "close": float(kline[4]),
                "volume": float(kline[5]),
                "close_time": int(kline[6]),
                "quote_volume": float(kline[7]),
                "trades_count": int(kline[8])
            })
            
        return klines
        
    except Exception as e:
        print(f"Error fetching klines for {symbol}: {e}")
        return []

def get_24hr_ticker(symbol: str) -> Dict[str, Any]:
    """Get 24hr ticker statistics for a symbol"""
    try:
        url = f"{BINANCE_API_BASE}/ticker/24hr"
        params = {"symbol": symbol}
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
        
    except Exception as e:
        print(f"Error fetching ticker for {symbol}: {e}")
        return {}

def get_exchange_info() -> Dict[str, Any]:
    """Get exchange information including symbols"""
    try:
        url = f"{BINANCE_API_BASE}/exchangeInfo"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching exchange info: {e}")
        return {}