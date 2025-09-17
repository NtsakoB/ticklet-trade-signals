from __future__ import annotations
import pandas as pd
import numpy as np

def ema(series: pd.Series, span: int) -> pd.Series:
    return series.ewm(span=span, adjust=False).mean()

def true_range(df: pd.DataFrame) -> pd.Series:
    prev_close = df["close"].shift(1)
    tr = pd.concat([
        (df["high"] - df["low"]).abs(),
        (df["high"] - prev_close).abs(),
        (df["low"]  - prev_close).abs(),
    ], axis=1).max(axis=1)
    return tr

def adx(df: pd.DataFrame, period: int = 14) -> pd.Series:
    up = df["high"].diff()
    down = -df["low"].diff()
    plus_dm  = np.where((up > down) & (up > 0), up, 0.0)
    minus_dm = np.where((down > up) & (down > 0), down, 0.0)
    tr = true_range(df)
    atr = tr.rolling(period).mean()
    plus_di  = 100 * pd.Series(plus_dm, index=df.index).rolling(period).mean() / atr
    minus_di = 100 * pd.Series(minus_dm, index=df.index).rolling(period).mean() / atr
    dx = (abs(plus_di - minus_di) / (plus_di + minus_di).replace(0, np.nan)) * 100
    return dx.rolling(period).mean().fillna(0)

def label_regime(df: pd.DataFrame,
                 fast: int = 50,
                 slow: int = 200,
                 adx_thr: float = 18.0,
                 vol_thr: float = 0.012) -> pd.DataFrame:
    df = df.copy()
    df["ema_fast"] = ema(df["close"], fast)
    df["ema_slow"] = ema(df["close"], slow)
    df["adx"] = adx(df)
    df["vol"] = true_range(df) / df["close"].shift(1)

    cond_bull = (df["ema_fast"] > df["ema_slow"]) & (df["adx"] >= adx_thr) & (df["vol"] >= vol_thr)
    cond_bear = (df["ema_fast"] < df["ema_slow"]) & (df["adx"] >= adx_thr) & (df["vol"] >= vol_thr)

    df["regime"] = np.where(cond_bull, "bull",
                     np.where(cond_bear, "bear", "chop"))
    return df