from talib import RSI
import numpy as np
from ticklet_ai.services.data_sources import get_klines_from_exchange

def get_missed_opportunities(symbols: list[str], interval: str = "5m", lookback: int = 30) -> list[dict]:
    """
    Detect missed trading opportunities based on RSI and rapid price pump using live data.

    Args:
        symbols (list[str]): List of trading pair symbols (e.g., ["BTCUSDT", "ETHUSDT"]).
        interval (str): Candle interval to fetch (e.g., "5m", "15m").
        lookback (int): Number of candles to look back for analysis (default is 30).

    Returns:
        list[dict]: List of missed opportunities.
    """
    missed_opportunities = []

    for symbol in symbols:
        # Pull live candle data from the exchange
        candles = get_klines_from_exchange(symbol, interval, lookback)
        if not candles or len(candles) < lookback:
            # Skip if insufficient data is retrieved
            continue

        # Extract closing prices
        closing_prices = np.array([candle['close'] for candle in candles])

        # Calculate percentage price change over the lookback period
        start_price = closing_prices[0]
        end_price = closing_prices[-1]
        pct_gain = ((end_price - start_price) / start_price) * 100

        # Calculate RSI using TA-Lib
        rsi_values = RSI(closing_prices, timeperiod=14)
        current_rsi = rsi_values[-1]

        # Mark as missed opportunity if conditions are met
        if pct_gain > 5 and current_rsi > 75:
            missed_opportunities.append({
                "symbol": symbol,
                "pct_gain": round(pct_gain, 2),
                "rsi": round(current_rsi, 2),
                "price": round(end_price, 6),
                "note": "Overbought" if current_rsi > 80 else "Wait for dip"
            })

    return missed_opportunities


def tag_as_missed(symbol: str, indicators: dict) -> bool:
    """
    Tag a symbol as a missed opportunity based on RSI and price gain thresholds.

    Args:
        symbol (str): Trading pair symbol (e.g., "BTCUSDT").
        indicators (dict): Dictionary containing relevant indicators (e.g., RSI, pct_gain).

    Returns:
        bool: True if the symbol qualifies as a missed opportunity, False otherwise.
    """
    return indicators['rsi'] > 75 and indicators['pct_gain'] > 5