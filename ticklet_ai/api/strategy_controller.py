from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from enum import Enum
from strategies.ticklet_alpha import TickletAlpha
from strategies.bull_strategy import BullStrategy
from strategies.jam_bot_strategy import JamBotStrategy
from strategies.ai_predictor_strategy import AIPredictorStrategy
from strategies.condition_strategy import ConditionStrategy
from fastapi.responses import JSONResponse
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Strategy mapping function
def get_selected_strategy(name: str):
    strategies = {
        "ticklet_alpha": TickletAlpha,
        "bull": BullStrategy,
        "jam_bot": JamBotStrategy,
        "ai": AIPredictorStrategy,
        "condition": ConditionStrategy
    }
    if name not in strategies:
        valid_strategies = ', '.join(strategies.keys())
        raise ValueError(f"Unknown strategy name: {name}. Available strategies are: {valid_strategies}")
    return strategies[name]()

# Enum to constrain valid strategy names
class StrategyName(str, Enum):
    ticklet_alpha = "ticklet_alpha"
    bull = "bull"
    jam_bot = "jam_bot"
    ai = "ai"
    condition = "condition"

# Input schema
class StrategyRequest(BaseModel):
    strategy_name: StrategyName
    trigger_type: str
    parameters: dict

# Runtime memory
active_strategies = {}

@app.post("/trigger-strategy/")
async def trigger_strategy(request: StrategyRequest):
    try:
        strategy = get_selected_strategy(request.strategy_name)
        active_strategies[request.strategy_name] = strategy
        if request.trigger_type == "telegram":
            return JSONResponse(content={"message": f"Strategy {request.strategy_name} triggered via Telegram."})
        elif request.trigger_type == "backtest":
            return JSONResponse(content={"message": f"Backtest for {request.strategy_name} started."})
        elif request.trigger_type == "ai":
            return JSONResponse(content={"message": f"AI module for {request.strategy_name} activated."})
        else:
            raise HTTPException(status_code=400, detail="Invalid trigger type.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/active-strategies/")
async def list_active_strategies():
    return {"active_strategies": list(active_strategies.keys())}

@app.post("/run-backtest/")
async def run_backtest(strategy_name: StrategyName, params: dict):
    try:
        strategy = get_selected_strategy(strategy_name)
        results = {"profit": 1000, "loss": 200}
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ai-trigger/")
async def ai_trigger(strategy_name: StrategyName, params: dict):
    try:
        strategy = get_selected_strategy(strategy_name)
        ai_response = {"decision": "Buy", "confidence": 0.9}
        return ai_response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/telegram-notify/")
async def telegram_notify(strategy_name: StrategyName, message: str):
    try:
        strategy = get_selected_strategy(strategy_name)
        return {"status": "Message sent", "strategy_name": strategy_name, "message": message}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))