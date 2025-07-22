import talib
import numpy as np

def evaluate_signal_safety(df, entry_price, direction):
    """
    Analyze the safety of a trade signal using AI/ML models.

    Args:
        df (DataFrame): Price chart data with OHLCV and additional columns (e.g., bid, ask).
        entry_price (float): The intended entry price for the signal.
        direction (str): Trade direction, either "long" or "short".

    Returns:
        dict: Analysis report containing confidence score, projected gain, risk/reward ratio, stop-loss suggestion, and notes.
    """
    # Calculate technical indicators
    atr = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14).iloc[-1]
    rsi = talib.RSI(df['close'], timeperiod=14).iloc[-1]
    macd, macdsignal, macdhist = talib.MACD(df['close'], fastperiod=12, slowperiod=26, signalperiod=9)
    ema_21 = talib.EMA(df['close'], timeperiod=21).iloc[-1]
    
    current_price = df['close'].iloc[-1]
    
    # Calculate stop loss and take profit levels
    if direction == "long":
        stop_loss = entry_price - (atr * 1.5)
        take_profit_1 = entry_price + (atr * 2.0)
        take_profit_2 = entry_price + (atr * 3.5)
    else:
        stop_loss = entry_price + (atr * 1.5)
        take_profit_1 = entry_price - (atr * 2.0)
        take_profit_2 = entry_price - (atr * 3.5)
    
    # Calculate projected gain to TP1
    projected_gain = abs(take_profit_1 - entry_price) / entry_price
    
    # Calculate risk to reward ratio
    risk = abs(entry_price - stop_loss)
    reward = abs(take_profit_1 - entry_price)
    risk_reward = reward / risk if risk > 0 else 0
    
    # AI confidence scoring based on multiple factors
    confidence_factors = []
    
    # RSI momentum alignment
    if direction == "long" and 30 <= rsi <= 65:
        confidence_factors.append(0.2)
    elif direction == "short" and 35 <= rsi <= 70:
        confidence_factors.append(0.2)
    else:
        confidence_factors.append(-0.1)
    
    # MACD histogram momentum
    current_macdhist = macdhist.iloc[-1]
    prev_macdhist = macdhist.iloc[-2]
    
    if direction == "long" and current_macdhist > prev_macdhist:
        confidence_factors.append(0.15)
    elif direction == "short" and current_macdhist < prev_macdhist:
        confidence_factors.append(0.15)
    else:
        confidence_factors.append(-0.05)
    
    # Price vs EMA alignment
    if direction == "long" and current_price > ema_21:
        confidence_factors.append(0.1)
    elif direction == "short" and current_price < ema_21:
        confidence_factors.append(0.1)
    else:
        confidence_factors.append(-0.05)
    
    # Risk-reward ratio bonus
    if risk_reward >= 2.0:
        confidence_factors.append(0.15)
    elif risk_reward >= 1.5:
        confidence_factors.append(0.1)
    else:
        confidence_factors.append(-0.1)
    
    # Volume confirmation (simplified)
    avg_volume = df['volume'].rolling(20).mean().iloc[-1]
    current_volume = df['volume'].iloc[-1]
    
    if current_volume > avg_volume * 1.2:
        confidence_factors.append(0.1)
    elif current_volume < avg_volume * 0.8:
        confidence_factors.append(-0.05)
    
    # Calculate final confidence (base 0.5 + factors)
    confidence = 0.5 + sum(confidence_factors)
    confidence = max(0.0, min(1.0, confidence))  # Clamp between 0 and 1
    
    # Generate pro-style commentary
    notes = []
    
    if confidence >= 0.8:
        notes.append("Strong setup with favorable momentum alignment.")
    elif confidence >= 0.6:
        notes.append("Moderate setup - watch for confirmation.")
    else:
        notes.append("Weak setup - consider waiting for better entry.")
    
    if risk_reward < 1.5:
        notes.append("Poor risk-reward ratio detected.")
    
    if direction == "long" and rsi > 70:
        notes.append("RSI suggests overbought conditions.")
    elif direction == "short" and rsi < 30:
        notes.append("RSI suggests oversold conditions.")
    
    return {
        "confidence": round(confidence, 3),
        "projected_gain": round(projected_gain, 4),
        "risk_reward": round(risk_reward, 2),
        "stop_loss": round(stop_loss, 6),
        "take_profit_1": round(take_profit_1, 6),
        "take_profit_2": round(take_profit_2, 6),
        "notes": " ".join(notes) if notes else "Standard signal conditions met."
    }