from pydantic import BaseModel, Field
from typing import Optional, Dict

class PredictionRequest(BaseModel):
    symbol: str = Field(..., description="Stock symbol for prediction")
    rsi: float = Field(..., ge=0, le=100, description="Relative Strength Index (0-100)")
    macd: float = Field(..., description="Moving Average Convergence Divergence")
    volume: float = Field(..., gt=0, description="Trading volume (must be positive)")
    anomaly_score: float = Field(..., description="Anomaly detection score")
    pump_confidence: float = Field(..., ge=0, le=1, description="Confidence in pump signal (0-1)")
    sentiment_score: Optional[float] = Field(None, description="Sentiment score (optional, default: None)")

class PredictionResponse(BaseModel):
    final_score: float = Field(..., description="Prediction confidence score")
    decision: str = Field(..., description="Buy or hold decision")
    breakdown: Dict[str, Optional[float]] = Field(..., description="Detailed breakdown of input features and AI evaluation")