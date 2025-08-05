import joblib
import os
import logging
from predict_schema import PredictionRequest, PredictionResponse

# Setup logging
logging.basicConfig(level=logging.INFO)

# Load model with error handling
MODEL_PATH = os.getenv("MODEL_PATH", "logistic_regression_model.pkl")
try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    raise Exception("Model file not found. Ensure logistic_regression_model.pkl is in the correct directory.")
except Exception as e:
    raise Exception(f"Error loading model: {str(e)}")

# Threshold for decision
THRESHOLD = float(os.getenv("THRESHOLD", 0.5))

def evaluate_signal(request: PredictionRequest) -> PredictionResponse:
    logging.info(f"Received prediction request: {request}")
    
    # Extract features
    features = [
        request.rsi,
        request.macd,
        request.volume,
        request.anomaly_score,
        request.pump_confidence,
        request.sentiment_score or 0
    ]
    
    try:
        probability = model.predict_proba([features])[0][1]
        decision = "buy" if probability >= THRESHOLD else "hold"
    except Exception as e:
        logging.error(f"Error during prediction: {str(e)}")
        raise Exception("Prediction failed. Check input features and model.")
    
    # Generate breakdown
    breakdown = {
        "rsi": request.rsi,
        "macd": request.macd,
        "volume": request.volume,
        "anomaly_score": request.anomaly_score,
        "pump_confidence": request.pump_confidence,
        "sentiment_score": request.sentiment_score or 0,
        "ai_probability": round(probability, 4)
    }
    
    logging.info(f"Prediction breakdown: {breakdown}")
    
    return PredictionResponse(
        final_score=round(probability * 100, 2),
        decision=decision,
        breakdown=breakdown
    )