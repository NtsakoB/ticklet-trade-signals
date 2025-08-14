from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class Position:
    symbol: str
    side: str
    qty: float
    entry: float

@dataclass
class PaperEngine:
    cash: float = 10000.0
    positions: List[Position] = field(default_factory=list)
    history: List[Dict] = field(default_factory=list)
    
    def place(self, symbol: str, side: str, qty: float, price: float):
        self.positions.append(Position(symbol, side, qty, price))
        self.history.append({"event":"order","symbol":symbol,"side":side,"qty":qty,"price":price})
        return {"ok": True}
    
    def close_all(self, price_map: Dict[str, float]):
        for p in self.positions:
            px = price_map.get(p.symbol, p.entry)
            pnl = (px - p.entry) * p.qty * (1 if p.side=="LONG" else -1)
            self.cash += pnl
            self.history.append({"event":"close","symbol":p.symbol,"pnl":pnl})
        self.positions.clear()
        return {"ok": True, "cash": self.cash}

engine = PaperEngine()