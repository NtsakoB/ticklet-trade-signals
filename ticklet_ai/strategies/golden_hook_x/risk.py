"""
Risk engine for GHX:
  - Safe leverage (no-liquidation) governance
  - Margin add/release automation with cooldown/hysteresis
  - Trim/exit helpers
  - Ladder placement respecting min leverage and volume filter
"""
from dataclasses import dataclass
import os, time

@dataclass
class SafetyCfg:
    min_liq_gap_pct: float
    min_liq_gap_usd: float
    add_margin_trigger_mmr: float
    add_margin_liq_gap_pct: float
    release_trigger_mmr: float
    release_liq_gap_pct: float
    release_step_pct: float
    min_margin_buffer_pct: float
    max_daily_margin_ops: int
    release_cooldown_sec: int
    model_leverage_cap: float
    min_volume_usdt: float
    min_leverage: float

class RiskEngine:
    def __init__(self, mexc, cfg: SafetyCfg, comfort_floor_fn):
        self.x = mexc
        self.cfg = cfg
        self.comfort_floor = comfort_floor_fn
        self.ops = {}

    def _cooldown_ok(self, symbol):
        now = time.time()
        ent = self.ops.get(symbol, {"t":0,"n":0})
        if now - ent["t"] < self.cfg.release_cooldown_sec: return False
        if ent["n"] >= self.cfg.max_daily_margin_ops: return False
        return True

    def _bump(self, symbol):
        now = time.time()
        ent = self.ops.get(symbol, {"t":0,"n":0})
        self.ops[symbol] = {"t":now,"n":ent["n"]+1}

    def max_safe_leverage(self, entry_price, symbol):
        floor = self.comfort_floor(symbol)
        if not floor: return self.cfg.min_leverage
        return min(self.cfg.model_leverage_cap, entry_price / floor)

    def enforce_no_liq(self, symbol):
        st = self.x.get_position_state(symbol)
        if st is None: return
        if self.x.get_24h_volume_usdt(symbol) < self.cfg.min_volume_usdt: return
        liq_gap_pct = max(0.0, 1.0 - (st.liq_price / max(1e-9, st.entry_price)))
        mmr = st.maintenance_margin_ratio
        need_add = (mmr >= self.cfg.add_margin_trigger_mmr) or (liq_gap_pct <= self.cfg.add_margin_liq_gap_pct)
        if need_add and self._cooldown_ok(symbol):
            add_amt = 0.05 * abs(st.position_size) * st.mark_price  # 5% notional bump
            if add_amt > 0:
                self.x.add_margin(symbol, add_amt); self._bump(symbol); return
        very_safe = (mmr <= self.cfg.release_trigger_mmr) and (liq_gap_pct >= self.cfg.release_liq_gap_pct)
        if very_safe and self._cooldown_ok(symbol) and st.margin > 0:
            release_amt = min(self.cfg.release_step_pct * abs(st.position_size) * st.mark_price,
                              st.margin * (1 - self.cfg.min_margin_buffer_pct))
            if release_amt > 0:
                self.x.remove_margin(symbol, release_amt); self._bump(symbol)

    def trim(self, symbol, pct=0.30):
        self.x.close_position_pct(symbol, pct)

    def exit_all(self, symbol):
        self.x.close_position_pct(symbol, 1.0)

    def arm_ladder(self, symbol, ladder, leverage):
        vol_ok = self.x.get_24h_volume_usdt(symbol) >= self.cfg.min_volume_usdt
        if not vol_ok: return
        # Use deepest rung as conservative entry for safe lev calc
        deepest = ladder.levels[-1][0]
        safe_lev = min(leverage, self.max_safe_leverage(deepest, symbol))
        safe_lev = max(safe_lev, self.cfg.min_leverage)
        self.x.place_ladder_buys(symbol, ladder.levels, leverage=safe_lev)