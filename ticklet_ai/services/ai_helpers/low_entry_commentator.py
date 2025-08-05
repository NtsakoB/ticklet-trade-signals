def analyze_entry_opportunity(symbol: str, indicators: dict) -> dict:
    """
    Analyze a symbol for low entry opportunities and provide AI-powered insights.

    Args:
        symbol (str): Trading pair symbol (e.g., "BTCUSDT").
        indicators (dict): Dictionary of relevant indicators (e.g., RSI, MACD histogram, ATR).

    Returns:
        dict: Analysis containing commentary, confidence, leverage, position size, and timeframe.
    """
    current_price = indicators["current_price"]
    projected_entry = indicators["projected_entry"]
    rsi = indicators["rsi"]
    macdhist = indicators["macdhist"]
    atr = indicators["atr"]

    # Generate confidence score based on indicators
    confidence = 0.9 if rsi < 35 and macdhist < -0.02 else 0.75 if rsi < 40 else 0.6

    # Generate leverage and position size recommendations
    leverage = 3 if confidence >= 0.9 else 2
    position_size_pct = 0.08 if confidence >= 0.9 else 0.05

    # Generate commentary
    if rsi < 35:
        commentary = f"RSI at {rsi:.1f} indicates oversold conditions. Strong pullback potential near {projected_entry:.6f}."
    elif rsi < 40:
        commentary = f"Pullback detected. RSI at {rsi:.1f} and MACD histogram suggest potential entry near {projected_entry:.6f}."
    else:
        commentary = f"Price approaching projected entry zone at {projected_entry:.6f}, but momentum is weakening."

    # Determine timeframe
    timeframe = "Next 1–3 days" if confidence >= 0.8 else "Monitor over next week"

    return {
        "commentary": commentary,
        "confidence": confidence,
        "leverage": leverage,
        "position_size_pct": position_size_pct,
        "timeframe": timeframe
    }