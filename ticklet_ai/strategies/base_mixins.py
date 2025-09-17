from __future__ import annotations
from typing import Dict, Any
import pandas as pd

class AiMlHooks:
    """Shared AI/ML hooks expected across Ticklet 7 strategies."""
    def ai_score(self, row: pd.Series) -> float:
        return float(row.get("ai_confidence", 0.0))

    def ml_score(self, row: pd.Series) -> float:
        return float(row.get("ml_confidence", 0.0))

class RegimeFilterMixin:
    """Provides a regime label per row and helper filters (bull, bear, chop)."""
    def _label_regime(self, df: pd.DataFrame) -> pd.DataFrame:
        from .market_regime_core import label_regime
        return label_regime(df)

    def is_bull(self, row: pd.Series) -> bool:
        return row.get("regime") == "bull"

    def is_bear(self, row: pd.Series) -> bool:
        return row.get("regime") == "bear"

    def is_chop(self, row: pd.Series) -> bool:
        return row.get("regime") == "chop"

class ConditionGateMixin:
    """Centralized pre-trade gates consistent with the rest of Ticklet 7."""
    def pass_common_gates(self, row: pd.Series) -> bool:
        daily_vol_ok = (row.get("usd_volume", 0) >= 100_000)
        not_delisted = bool(row.get("not_delisted", True))
        follows_btc  = bool(row.get("btc_corr_ok", True))
        anomaly_ok   = (row.get("anomaly_score", 0) >= 0.5)  # 0..1
        return daily_vol_ok and not_delisted and follows_btc and anomaly_ok

    def min_confidence_ok(self, row: pd.Series, thresh: float = 0.55) -> bool:
        return self.ai_score(row) * 0.5 + self.ml_score(row) * 0.5 >= thresh