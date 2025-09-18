from typing import Iterable, Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class SignalProposal:
    symbol: str
    entry_price: float
    stop_price: float
    targets: list[float]
    side: str  # 'BUY' | 'SELL'
    meta: Dict[str, Any] | None = None

class Strategy:
    name: str
    async def propose(self) -> Iterable[SignalProposal]: ...
    async def should_close(self, signal_row: dict, live_price: float) -> Optional[Dict[str, Any]]: ...
    async def is_still_valid(self, signal_row: dict, live_price: float) -> bool: return True
    async def sizing_for(self, signal_row: dict): return 1.0, None  # qty, leverage