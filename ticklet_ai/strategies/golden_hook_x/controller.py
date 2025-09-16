"""
GHX state machine:
  ACCUMULATE -> RIDE -> (TRIM) -> EXIT -> RE-ARM
"""
from dataclasses import dataclass
import json, os, time
from .signals import compute_scores
from .reentry import build_ladder
from .risk import RiskEngine, SafetyCfg

@dataclass
class GHXState:
    mode: str = "RE-ARM"
    trimmed: bool = False
    last_exit_ts: float = 0.0

class GoldenHookXController:
    def __init__(self, ctx, mexc_client, comfort_floor_fn):
        self.ctx = ctx
        self.mexc = mexc_client
        self.state = {}
        self.thr = json.loads(os.getenv("GHX_THRESHOLDS",
            '{"enter_hook_HC":60,"ride_TS_min":55,"trim_DR_warn":60,"exit_DR_hard":75,"exit_confirm_bars":2,"rearm_HC_min":65,"hysteresis":5}'))
        saf = json.loads(os.getenv("GHX_SAFETY",
            '{"min_liq_gap_pct":0.40,"min_liq_gap_usd":1200,"add_margin_trigger_mmr":0.75,"add_margin_liq_gap_pct":0.30,"release_trigger_mmr":0.40,"release_liq_gap_pct":0.55,"release_step_pct":0.08,"min_margin_buffer_pct":0.12,"max_daily_margin_ops":12}'))
        self.risk = RiskEngine(
            mexc_client,
            SafetyCfg(
                min_liq_gap_pct=saf["min_liq_gap_pct"],
                min_liq_gap_usd=saf["min_liq_gap_usd"],
                add_margin_trigger_mmr=saf["add_margin_trigger_mmr"],
                add_margin_liq_gap_pct=saf["add_margin_liq_gap_pct"],
                release_trigger_mmr=saf["release_trigger_mmr"],
                release_liq_gap_pct=saf["release_liq_gap_pct"],
                release_step_pct=saf["release_step_pct"],
                min_margin_buffer_pct=saf["min_margin_buffer_pct"],
                max_daily_margin_ops=saf["max_daily_margin_ops"],
                release_cooldown_sec=int(os.getenv("GHX_RELEASE_COOLDOWN_SEC","900")),
                model_leverage_cap=float(os.getenv("GHX_MODEL_LEVERAGE_CAP","2.5")),
                min_volume_usdt=float(os.getenv("GHX_MIN_VOLUME_USDT","10000000")),
                min_leverage=float(os.getenv("GHX_MIN_LEVERAGE","2.0")),
            ),
            comfort_floor_fn
        )

    def _st(self, symbol): return self.state.setdefault(symbol, GHXState())

    def tick(self, symbol):
        if os.getenv("GHX_ENABLED","true").lower() != "true": return
        scores = compute_scores(self.ctx, symbol)
        st = self._st(symbol)

        # ACCUMULATE / RE-ARM: prep ladder if HC strong
        if st.mode in ("ACCUMULATE","RE-ARM"):
            if scores.hc >= self.thr["enter_hook_HC"] and self.ctx.volume.ok(symbol):
                ladder = build_ladder(self.ctx.data.get_klines(symbol), self.ctx.data.get_vpvr(symbol))
                self.risk.arm_ladder(symbol, ladder, leverage=float(os.getenv("GHX_MIN_LEVERAGE","2.0")))
                st.mode = "RIDE"; st.trimmed = False
                self.ctx.signals.ghx_entry(symbol, ladder, scores, liq_info={"ideal_sl":"n/a","liq":"live"})
                return

        # RIDE: enforce no-liq; trim/exit by risk; re-arm lower on exit
        if st.mode == "RIDE":
            self.risk.enforce_no_liq(symbol)

            if scores.dr >= self.thr["exit_DR_hard"] and self.ctx.signals.confirmed(scores.dr, self.thr["exit_confirm_bars"]):
                self.risk.exit_all(symbol)
                self.ctx.signals.ghx_exit(symbol, scores, self.ctx.reentry.plan(symbol))
                st.mode = "RE-ARM"; st.trimmed = False; st.last_exit_ts = time.time()
                return

            if (not st.trimmed) and scores.dr >= self.thr["trim_DR_warn"]:
                self.risk.trim(symbol, pct=0.30)
                st.trimmed = True
                self.ctx.signals.ghx_trim(symbol, 0.30, scores)
                return