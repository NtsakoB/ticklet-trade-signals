"""
Golden Hook X feature builders:
  - Trend Strength (TS) 0..100
  - Drop Risk (DR)     0..100
  - Hook Confluence(HC)0..100
Relies on ctx.data providers already present in the app (klines, vpvr, structure, etc).
"""
from dataclasses import dataclass

@dataclass
class Scores:
    ts: float
    dr: float
    hc: float

def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

def _to100(x: float) -> float:
    return max(0.0, min(100.0, x))

def trend_strength(kl):
    # Heuristic: EMA slopes & HH structure. Replace with project helpers if available.
    ema20 = kl.ema(20); ema50 = kl.ema(50)
    slope20 = (ema20[-1] - ema20[-6]) / max(1e-9, abs(ema20[-6]))
    slope50 = (ema50[-1] - ema50[-6]) / max(1e-9, abs(ema50[-6]))
    hh = 1.0 if kl.is_higher_highs(20) else 0.0
    score = 50 + 30*_clamp01(5*slope20) + 15*_clamp01(5*slope50) + 5*hh
    return _to100(score)

def drop_risk(kl, funding, oi, ob, bb):
    rsi_div = 1.0 if kl.has_bearish_divergence("RSI", w1=60, w2=240) else 0.0
    macd_div = 1.0 if kl.has_bearish_divergence("MACD", w1=60, w2=240) else 0.0
    crowd = 0.0
    if funding and oi:
        crowd = 40.0*float(_clamp01(funding.spike_score()+oi.bulge_score()))
    vol_roll = 20.0*float(_clamp01(bb.rollover_score())) if bb else 0.0
    orderbook = 20.0*float(_clamp01(ob.offer_wall_score()-ob.bid_thin_score())) if ob else 0.0
    raw = 30.0*(rsi_div+macd_div) + crowd + vol_roll + orderbook
    return _to100(raw)

def hook_confluence(kl, vpvr, structure):
    fib = 40.0*float(_clamp01(kl.fib_confluence_score()))
    hvn = 40.0*float(_clamp01(vpvr.hvn_score())) if vpvr else 0.0
    sr  = 20.0*float(_clamp01(structure.sr_flip_score())) if structure else 0.0
    return _to100(fib + hvn + sr)

def compute_scores(ctx, symbol) -> Scores:
    kl = ctx.data.get_klines(symbol)
    vp = ctx.data.get_vpvr(symbol)
    st = ctx.data.get_structure(symbol)
    fd = ctx.data.get_funding(symbol)
    oi = ctx.data.get_open_interest(symbol)
    ob = ctx.data.get_orderbook(symbol)
    bb = ctx.data.get_bbwidth(symbol)
    ts = trend_strength(kl)
    dr = drop_risk(kl, fd, oi, ob, bb)
    hc = hook_confluence(kl, vp, st)
    return Scores(ts=ts, dr=dr, hc=hc)