from .ticklet_alpha_adapter import TickletAlpha
from .golden_hook_adapter import GoldenHook
from .market_regime_adapter import MarketRegime

REGISTRY = {
    "TickletAlpha": TickletAlpha(),
    "GoldenHook": GoldenHook(),
    "MarketRegime": MarketRegime(),
}

def get_strategy(name: str):
    return REGISTRY.get(name, REGISTRY["TickletAlpha"])