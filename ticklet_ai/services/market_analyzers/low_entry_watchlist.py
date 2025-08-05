import talib
import numpy as np
from ticklet_ai.services.data_sources import get_klines_from_exchange
from ticklet_ai.services.ai_helpers.low_entry_commentator import analyze_entry_opportunity

def get_low_entry_watchlist(symbols: list[str], interval: str = "5m", lookback: int = 50) -> list[dict]:
    """
    Detect potential low entry opportunities for symbols based on live candlestick data.

    Args:
        symbols (list[str]): List of trading pair symbols (e.g., ["BTCUSDT", "ETHUSDT"]).
        interval (str): Candlestick interval to fetch (e.g., "5m", "15m").
        lookback (int): Number of candles to look back for analysis (default 50).

    Returns:
        list[dict]: List of symbols with low entry opportunities.
    """
    low_entry_watchlist = []

    for symbol in symbols:
        # Pull live candlestick data
        candles = get_klines_from_exchange(symbol, interval, lookback)
        if not candles or len(candles) < lookback:
            # Skip if insufficient data is retrieved
            continue

        # Extract closing prices
        closing_prices = np.array([candle['close'] for candle in candles])
        highs = np.array([candle['high'] for candle in candles])
        lows = np.array([candle['low'] for candle in candles])

        # Calculate TA-Lib indicators
        ema_21 = talib.EMA(closing_prices, timeperiod=21)
        rsi = talib.RSI(closing_prices, timeperiod=14)
        macd, macdsignal, macdhist = talib.MACD(closing_prices, fastperiod=12, slowperiod=26, signalperiod=9)
        atr = talib.ATR(highs, lows, closing_prices, timeperiod=14)

        # Get current values
        current_price = closing_prices[-1]
        current_ema_21 = ema_21[-1]
        current_rsi = rsi[-1]
        current_macdhist = macdhist[-1]
        current_atr = atr[-1]

        # Low entry condition: close < ema_21 AND rsi < 40 AND macdhist < 0
        if current_price < current_ema_21 and current_rsi < 40 and current_macdhist < 0:
            # Estimate projected entry price
            projected_entry = current_price - (current_atr * 0.8)

            # Call AI module for commentary and recommendation
            ai_analysis = analyze_entry_opportunity(symbol, {
                "current_price": current_price,
                "projected_entry": projected_entry,
                "rsi": current_rsi,
                "macdhist": current_macdhist,
                "atr": current_atr
            })

            # Add to watchlist
            low_entry_watchlist.append({
                "symbol": symbol,
                "current_price": round(current_price, 6),
                "projected_entry": round(projected_entry, 6),
                "status": "Retest Expected",
                "commentary": ai_analysis["commentary"],
                "ai_recommendation": {
                    "confidence": ai_analysis["confidence"],
                    "leverage": ai_analysis["leverage"],
                    "position_size_pct": ai_analysis["position_size_pct"],
                    "timeframe": ai_analysis["timeframe"]
                }
            })

    # Sort by highest AI confidence score
    low_entry_watchlist.sort(key=lambda x: x["ai_recommendation"]["confidence"], reverse=True)

    return low_entry_watchlist