from freqtrade.strategy import IStrategy, CategoricalParameter, IntParameter, DecimalParameter
from pandas import DataFrame
import numpy as np
import pandas as pd
import os
from typing import Dict, Any

"""
GoldenHookX (Freqtrade):
  - Long-only futures, ≥2x leverage (never 1x).
  - No hard stoploss: we emulate "no-stop" by a very wide stop and manage exits via Drop Risk (DR).
  - Enters at "hook" zones (Fib/structure proxy) when Hook Confluence (HC) is good.
  - Rides trend (TS). When DR spikes (predictive drawdown), exit into strength and re-arm lower hooks.
  - $10M+ volume gate (approx via quote volume on 1h).
"""

# ---- Env / defaults
MIN_LEV = float(os.getenv("GHX_MIN_LEVERAGE", "2.0"))
LEV_CAP = float(os.getenv("GHX_MODEL_LEVERAGE_CAP", "2.5"))
VOL_MIN = float(os.getenv("GHX_MIN_VOLUME_USD_24H", "10000000"))
DR_HARD = float(os.getenv("GHX_EXIT_DR_HARD", "75"))   # exit threshold
DR_WARN = float(os.getenv("GHX_TRIM_DR_WARN", "60"))   # (not used to trim partially in FT core; used as caution)
COMFORT_FLOOR = 2000.0  # used to bound leverage if implementing exchange leverage elsewhere

class GoldenHookX(IStrategy):
    # Base TF and informative TFs
    timeframe = '1h'
    informative_timeframe = '4h'
    can_short = False
    position_adjustment_enable = False   # classic long-only
    use_exit_signal = True
    startup_candle_count: int = 200
    # Emulate "no stop": very wide, we exit via custom exit logic
    stoploss = -0.99
    # Hold to target unless DR spikes
    minimal_roi = {"0": 1000}

    # --- Leverage (Freqtrade futures adapters may call this) ---
    def leverage(self, pair: str, current_time, current_rate, proposed_leverage: float, **kwargs) -> float:
        # Enforce ≥2x and cap to LEV_CAP. If you implement comfort-floor logic, clamp more.
        lev = max(MIN_LEV, min(LEV_CAP, proposed_leverage if proposed_leverage else MIN_LEV))
        return lev

    # --- Hyperopt-able parameters (optional) ---
    ts_enter = IntParameter(40, 80, default=55, space="buy")
    hc_min   = IntParameter(50, 80, default=60, space="buy")
    dr_exit  = IntParameter(60, 90, default=int(DR_HARD), space="sell")

    def informative_pairs(self):
        pairs = self.dp.current_whitelist()
        return [(p, self.informative_timeframe) for p in pairs]

    def populate_indicators(self, df: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        # Base TF indicators (1h)
        for span in (20, 50, 100):
            df[f'ema{span}'] = df['close'].ewm(span=span, adjust=False).mean()
        df['ema_slope20'] = (df['ema20'] - df['ema20'].shift(6)) / df['ema20'].shift(6).abs().replace(0, np.nan)
        df['ema_slope50'] = (df['ema50'] - df['ema50'].shift(6)) / df['ema50'].shift(6).abs().replace(0, np.nan)

        # Quote volume approx in USD on 1h (volume * close); for 24h, rolling sum of last 24 candles.
        df['quote_vol_usd'] = (df['volume'] * df['close']).fillna(0.0)
        df['quote_vol_24h'] = df['quote_vol_usd'].rolling(24, min_periods=1).sum()

        # Hook Confluence proxy:
        # - Fib re-entry zones derived from last swing
        # - Proximity score: closeness to 0.382/0.5/0.618 retracement
        df['swing_high'] = df['high'].rolling(48, min_periods=2).max()
        df['swing_low']  = df['low'].rolling(48, min_periods=2).min()
        rng = (df['swing_high'] - df['swing_low']).replace(0, np.nan)
        f382 = df['swing_high'] - 0.382 * rng
        f50  = df['swing_high'] - 0.500 * rng
        f618 = df['swing_high'] - 0.618 * rng
        prox = 100 - 100 * ((df['close'] - pd.concat([f382,f50,f618], axis=1).apply(lambda r: r.iloc[(r - df['close']).abs().argmin()], axis=1)).abs() / (0.5 * rng))
        df['hc'] = prox.clip(lower=0, upper=100).fillna(0)

        # Trend Strength (TS): EMA slopes + structure
        hh = (df['high'] > df['high'].shift(1)) & (df['close'] > df['close'].shift(1))
        ts = 50 + 30 * df['ema_slope20'].clip(-0.2, 0.2).fillna(0) + 15 * df['ema_slope50'].clip(-0.2, 0.2).fillna(0) + 5 * hh.astype(int)
        df['ts'] = ts.clip(lower=0, upper=100).fillna(0)

        # Drop Risk (DR): bearish conditions proxy
        # - EMA compression/rollover, volatility stall (BB proxy), lower highs
        df['bb_width'] = (df['close'].rolling(20).std() / df['close'].rolling(20).mean()).fillna(0)
        lh = (df['high'] < df['high'].shift(1)) & (df['close'] < df['close'].shift(1))
        dr = 30*lh.astype(int) + 30*(df['bb_width'].diff() < 0).astype(int) + 40*(df['ema20'] < df['ema50']).astype(int)
        df['dr'] = dr.clip(lower=0, upper=100).fillna(0)

        # 4h informative context
        inf = self.dp.get_pair_dataframe(pair=metadata['pair'], timeframe=self.informative_timeframe)
        if not inf.empty:
            for span in (20, 50, 100):
                inf[f'i_ema{span}'] = inf['close'].ewm(span=span, adjust=False).mean()
            inf['i_trend'] = (inf['i_ema20'] > inf['i_ema50']).astype(int)
            df = df.join(inf[['i_trend']].rename(columns={'i_trend': 'i_trend'}), how='left').fillna(method='ffill')

        return df

    def populate_entry_trend(self, df: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        # Volume gate ($10M+ rolling 24h)
        vol_ok = (df['quote_vol_24h'] >= VOL_MIN)

        # Entry when Hook Confluence strong, trend acceptable, and volume ok
        df.loc[
            (vol_ok) &
            (df['hc'] >= self.hc_min.value) &
            (df['ts'] >= self.ts_enter.value) &
            (df['i_trend'] >= 0),  # 4h not fighting us
            ['enter_long', 'enter_tag']
        ] = (1, 'GHX_hook')

        return df

    def populate_exit_trend(self, df: DataFrame, metadata: Dict[str, Any]) -> DataFrame:
        # Predictive exit: Drop Risk spikes
        df.loc[
            (df['dr'] >= self.dr_exit.value),
            ['exit_long', 'exit_tag']
        ] = (1, 'GHX_DR_exit')

        return df