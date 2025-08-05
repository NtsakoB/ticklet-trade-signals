import logging

logging.basicConfig(level=logging.INFO)

def calculate_strategy_score(rsi: float, macd: float, volume: float, rsi_weight: float = 0.3, macd_weight: float = 0.3, volume_weight: float = 0.4) -> float:
    """
    Calculates a strategy score based on RSI, MACD, and trading volume.
    
    Args:
        rsi (float): Relative Strength Index (0-100).
        macd (float): Moving Average Convergence Divergence.
        volume (float): Trading volume (must be non-negative).
        rsi_weight (float): Weight for RSI condition.
        macd_weight (float): Weight for MACD condition.
        volume_weight (float): Weight for volume condition.
    
    Returns:
        float: Rounded strategy score.
    """
    # Validate inputs
    if not (0 <= rsi <= 100):
        raise ValueError("RSI must be between 0 and 100.")
    if volume < 0:
        raise ValueError("Volume must be non-negative.")
    
    logging.info(f"Calculating strategy score with RSI: {rsi}, MACD: {macd}, Volume: {volume}")
    
    # Compute score
    score = 0
    if rsi < 30:
        score += rsi_weight
    if macd > 0:
        score += macd_weight
    if volume > 100000:
        score += volume_weight
    
    final_score = round(score, 2)
    logging.info(f"Calculated strategy score: {final_score}")
    return final_score