"""
Minimal client wrappers used by GHX. Adapt these to your existing adapters.
"""
from dataclasses import dataclass

@dataclass
class PositionState:
    entry_price: float
    liq_price: float
    maintenance_margin_ratio: float
    margin: float
    position_size: float
    mark_price: float

class MexcClient:
    def __init__(self, adapters):
        self.adapters = adapters

    def get_position_state(self, symbol) -> PositionState | None:
        return self.adapters.positions.read(symbol)

    def get_24h_volume_usdt(self, symbol) -> float:
        return self.adapters.market.volume_usdt(symbol)

    def add_margin(self, symbol, amount_usdt: float):
        return self.adapters.positions.add_margin(symbol, amount_usdt)

    def remove_margin(self, symbol, amount_usdt: float):
        return self.adapters.positions.remove_margin(symbol, amount_usdt)

    def close_position_pct(self, symbol, pct: float):
        return self.adapters.orders.close_pct(symbol, pct)

    def place_ladder_buys(self, symbol, levels, leverage: float):
        return self.adapters.orders.place_ladder(symbol, levels, leverage)