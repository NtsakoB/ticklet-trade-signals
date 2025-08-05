from ticklet_ai.services.data_sources import get_klines_from_exchange
from ticklet_ai.services.ai_helpers.bounce_predictor import score_bounce
import numpy as np

def get_near_lows(all_candles: dict, threshold: float = 0.03) -> list[dict]:
    """
    Detect symbols trading near their lowest price over a recent window.

    Args:
        all_candles (dict): Dictionary where keys are symbols and values are lists of candle data.
        threshold (float): Percentage threshold from the low to filter symbols.

    Returns:
        list[dict]: List of symbols trading near their lowest price.
    """
    near_lows = []

    for symbol, candles in all_candles.items():
        # Ensure sufficient candles for analysis (e.g., at least 50)
        if len(candles) < 50:
            continue

        # Extract closing prices from the last 50 candles
        closing_prices = np.array([candle['close'] for candle in candles[-50:]])

        # Calculate the lowest closing price over the lookback period
        lookback_low = np.min(closing_prices)
        current_price = closing_prices[-1]

        # Calculate % difference from the low
        pct_from_low = ((current_price - lookback_low) / lookback_low) * 100

        # Filter symbols within the threshold from the low
        if pct_from_low <= (threshold * 100):
            # Call AI model for bounce score and commentary
            bounce_score, commentary = score_bounce(symbol, {
                "current_price": current_price,
                "lookback_low": lookback_low,
                "pct_from_low": pct_from_low
            })

            near_lows.append({
                "symbol": symbol,
                "current_price": round(current_price, 6),
                "lookback_low": round(lookback_low, 6),
                "pct_from_low": round(pct_from_low, 2),
                "score": round(bounce_score, 2),
                "commentary": commentary
            })

    # Sort results by proximity to the low (lowest % first)
    near_lows.sort(key=lambda x: x["pct_from_low"])

    return near_lows