from fastapi import APIRouter
from pydantic import BaseModel
from ..services.trading import engine

router = APIRouter(prefix="/paper", tags=["paper"])

class Order(BaseModel):
    symbol: str
    side: str
    qty: float
    price: float

@router.post("/order")
def order(o: Order):
    return engine.place(o.symbol, o.side.upper(), o.qty, o.price)

@router.post("/close-all")
def close_all(prices: dict[str, float]):
    return engine.close_all(prices)

@router.get("/state")
def state():
    return {"cash": engine.cash, "positions": [p.__dict__ for p in engine.positions], "history": engine.history}