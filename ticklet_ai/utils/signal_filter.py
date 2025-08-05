import talib
from ticklet_ai.services.ai_helpers.signal_safety_analyzer import evaluate_signal_safety

def should_generate_signal(df, entry_price, direction, strategy_id):
    """
    Global signal filter to decide whether a trade signal should be generated.

    Args:
        df (DataFrame): Price chart data with OHLCV and additional columns (e.g., bid, ask).
        entry_price (float): The intended entry price for the signal.
        direction (str): Trade direction, either "long" or "short".
        strategy_id (str): Strategy identifier for specific tuning.

    Returns:
        bool: True if the signal passes all safety checks, False otherwise.
        dict: Explanation of why the signal was blocked (if applicable).
    """
    # Calculate indicators
    rsi = talib.RSI(df['close'], timeperiod=14).iloc[-1]
    macd, macdsignal, macdhist = talib.MACD(df['close'], fastperiod=12, slowperiod=26, signalperiod=9)
    atr = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14).iloc[-1]
    volume = df['volume'].iloc[-1]
    spread = abs(df['ask'].iloc[-1] - df['bid'].iloc[-1]) / df['close'].iloc[-1]

    # Call AI/ML safety analyzer
    ai_analysis = evaluate_signal_safety(df, entry_price, direction)

    # Calculate conditions
    projected_gain = ai_analysis["projected_gain"]
    confidence = ai_analysis["confidence"]
    risk_to_reward = ai_analysis["risk_reward"]
    sl_recommendation = ai_analysis["stop_loss"]

    # Block conditions
    reasons = []
    if volume < 100000:
        reasons.append("Low volume (< $100K)")
    if spread > 0.01:
        reasons.append(f"High spread (> 1%) - {round(spread * 100, 2)}%")
    if confidence < 0.6:
        reasons.append(f"Low AI confidence ({confidence * 100:.2f}%)")
    if direction == "long" and rsi > 78:
        reasons.append(f"RSI overbought ({rsi:.2f})")
    if direction == "short" and rsi < 22:
        reasons.append(f"RSI oversold ({rsi:.2f})")
    if projected_gain < 0.02:
        reasons.append(f"Unlikely to reach TP1 (projected gain: {projected_gain * 100:.2f}%)")
    
    # Result
    if reasons:
        return False, {"blocked": True, "reasons": reasons, "ai_notes": ai_analysis.get("notes", "")}
    return True, {"blocked": False}