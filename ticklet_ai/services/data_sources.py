"""
Data sources for fetching live market data from exchanges
"""
import logging
import requests
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

BINANCE_BASE = "https://api.binance.com/api/v3"

def get_klines_from_exchange(symbol: str, interval: str = "1h", limit: int = 100) -> List[Dict[str, Any]]:
    """
    Fetch klines (candlestick data) from Binance API
    
    Args:
        symbol: Trading pair symbol (e.g., "BTCUSDT")
        interval: Candle interval (e.g., "1h", "5m", "15m")
        limit: Number of candles to fetch
        
    Returns:
        List of candle dictionaries with OHLCV data
    """
    try:
        url = f"{BINANCE_BASE}/klines"
        params = {
            "symbol": symbol,
            "interval": interval,
            "limit": min(limit, 1000)  # Binance max
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        raw_klines = response.json()
        
        # Convert to standardized format
        klines = []
        for k in raw_klines:
            klines.append({
                "time": int(k[0]),
                "open": float(k[1]),
                "high": float(k[2]),
                "low": float(k[3]),
                "close": float(k[4]),
                "volume": float(k[5]),
                "close_time": int(k[6]),
                "quote_volume": float(k[7]),
                "trades_count": int(k[8])
            })
            
        return klines
        
    except Exception as e:
        logger.error(f"Error fetching klines for {symbol}: {e}")
        return []

def get_ticker_24hr(symbol: str = None) -> Dict[str, Any] | List[Dict[str, Any]]:
    """
    Get 24hr ticker statistics
    
    Args:
        symbol: Optional trading pair symbol. If None, returns all tickers
        
    Returns:
        Ticker data dictionary or list of ticker dictionaries
    """
    try:
        url = f"{BINANCE_BASE}/ticker/24hr"
        params = {"symbol": symbol} if symbol else {}
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
        
    except Exception as e:
        logger.error(f"Error fetching ticker for {symbol}: {e}")
        return {} if symbol else []

def get_current_price(symbol: str) -> float:
    """
    Get current price for a symbol
    
    Args:
        symbol: Trading pair symbol
        
    Returns:
        Current price as float, or 0.0 on error
    """
    try:
        url = f"{BINANCE_BASE}/ticker/price"
        params = {"symbol": symbol}
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        return float(data.get("price", 0))
        
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        return 0.0
