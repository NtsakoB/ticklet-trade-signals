from talib import RSI
import numpy as np

def get_missed_opportunities(all_candles: dict) -> list[dict]:
    """
    Detect missed trading opportunities based on RSI and rapid price pump.

    Args:
        all_candles (dict): Dictionary where keys are symbols and values are lists of candle data.

    Returns:
        list[dict]: List of missed opportunities.
    """
    missed_opportunities = []

    for symbol, candles in all_candles.items():
        # Ensure there are sufficient candles (e.g., at least 30 for analysis)
        if len(candles) < 30:
            continue

        # Extract closing prices for the last 30 candles
        closing_prices = np.array([candle['close'] for candle in candles])

        # Calculate percentage price change over the last 15–30 candles
        start_price = closing_prices[-30]
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