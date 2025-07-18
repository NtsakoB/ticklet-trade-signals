# Shared Constants and Types
# Common utilities across the AI service

from enum import Enum

class SignalType(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class ModelType(Enum):
    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    LOGISTIC_REGRESSION = "logistic_regression"

# Shared constants
DEFAULT_CONFIDENCE_THRESHOLD = 0.75
MAX_SIGNAL_AGE_HOURS = 24