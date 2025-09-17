from __future__ import annotations
from typing import Dict, Any
from pandas import DataFrame
from freqtrade.strategy.interface import IStrategy
from .base_mixins import RegimeFilterMixin, ConditionGateMixin, AiMlHooks
from .market_regime_core import label_regime

class MarketRegimeStrategy(IStrategy, RegimeFilterMixin, ConditionGateMixin, AiMlHooks):
    timeframe = "30m"
    informative_timeframe = "4h"
    can_short = True

    minimal_roi = {"0": 0.10, "120": 0.03}
    stoploss = -0.10
    use_custom_stoploss = False

    def populate_indicators(self, dataframe: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        df = dataframe.copy()
        df = label_regime(df)
        for col, default in [
            ("ai_confidence", 0.0), ("ml_confidence", 0.0), ("anomaly_score", 0.0),
            ("usd_volume", 0.0), ("not_delisted", True), ("btc_corr_ok", True)
        ]:
            if col not in df.columns:
                df[col] = default
        return df

    def populate_entry_trend(self, dataframe: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        df = dataframe.copy()
        long_cond = (
            (df["regime"] == "bull") &
            df.apply(self.pass_common_gates, axis=1) &
            df.apply(self.min_confidence_ok, axis=1)
        )
        short_cond = (
            (df["regime"] == "bear") &
            df.apply(self.pass_common_gates, axis=1) &
            df.apply(self.min_confidence_ok, axis=1)
        )
        df.loc[long_cond,  "enter_long"]  = 1
        df.loc[short_cond, "enter_short"] = 1
        return df

    def populate_exit_trend(self, dataframe: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        df = dataframe.copy()
        exit_long  = (df["regime"] != "bull")
        exit_short = (df["regime"] != "bear")
        df.loc[exit_long,  "exit_long"]  = 1
        df.loc[exit_short, "exit_short"] = 1
        return df