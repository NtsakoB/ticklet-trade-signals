def score_bounce(symbol: str, indicators: dict) -> tuple[float, str]:
    """
    Use AI model to return:
    - bounce probability (0.0 to 1.0)
    - commentary based on indicators

    Args:
        symbol (str): Trading pair symbol (e.g., "BTCUSDT").
        indicators (dict): Dictionary containing relevant indicators (e.g., current_price, lookback_low, pct_from_low).

    Returns:
        tuple[float, str]: Bounce probability and commentary.
    """
    # Example AI logic (replace with real model inference)
    current_price = indicators["current_price"]
    lookback_low = indicators["lookback_low"]
    pct_from_low = indicators["pct_from_low"]

    # Simple heuristic-based bounce scoring
    if pct_from_low <= 1:
        bounce_score = 0.9
        commentary = "Approaching strong support – high bounce potential"
    elif pct_from_low <= 2:
        bounce_score = 0.75
        commentary = "Near support – moderate bounce potential"
    else:
        bounce_score = 0.5
        commentary = "Weak bounce probability – monitor further"

    return bounce_score, commentary