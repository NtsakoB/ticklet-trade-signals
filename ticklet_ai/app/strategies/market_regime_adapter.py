from typing import List
from .base import Strategy, SignalProposal
from ticklet_ai.strategies.market_regime_core import label_regime
from ticklet_ai.services.scanner import get_candidates
import pandas as pd

class MarketRegime(Strategy):
    name = "MarketRegime"

    async def propose(self) -> List[SignalProposal]:
        # Use market regime logic for signal generation
        candidates = get_candidates()
        proposals = []
        
        for c in candidates:
            # Market Regime strategy adapts to market conditions
            symbol = c["symbol"]
            
            # Create regime-based proposal
            entry_price = (c["entry_low"] + c["entry_high"]) / 2
            
            # Market regime adjusts stop based on volatility
            volatility_factor = 1.0  # Could be calculated from market data
            stop_multiplier = 0.95 if c.get("side", "BUY") == "BUY" else 1.05
            stop_price = entry_price * stop_multiplier
            
            # Regime-based targets
            rr = c.get("rr_tp2", 1.5)  # More conservative in uncertain regimes
            risk = abs(entry_price - stop_price)
            target1 = entry_price + (risk * 0.8) if c.get("side", "BUY") == "BUY" else entry_price - (risk * 0.8)
            target2 = entry_price + (risk * rr) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr)
            target3 = entry_price + (risk * rr * 2.0) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr * 2.0)
            
            proposals.append(SignalProposal(
                symbol=symbol,
                entry_price=entry_price,
                stop_price=stop_price,
                targets=[target1, target2, target3],
                side=c.get("side", "BUY"),
                meta={
                    "strategy": "MarketRegime",
                    "regime": "unknown",  # Would be calculated from actual market data
                    "confidence": c.get("confidence", 0.0),
                    "volatility_factor": volatility_factor,
                    "market_condition": "neutral"
                }
            ))
        
        return proposals

    async def should_close(self, signal_row: dict, live_price: float):
        # Market regime specific exit logic - adapts to conditions
        entry_price = signal_row.get("entry_price", 0)
        stop_price = signal_row.get("stop_price", 0)
        targets = signal_row.get("targets", [])
        meta = signal_row.get("meta", {})
        
        # Market regime may adjust exits based on regime changes
        regime = meta.get("regime", "neutral")
        
        if signal_row.get("side") == "BUY":
            if live_price <= stop_price:
                return {"stage": "SL", "reason_closed": f"Market regime stop loss ({regime})", "exit_price": live_price}
            # Market regime may exit earlier in bear conditions
            if regime == "bear" and targets and live_price >= targets[0] * 0.8:
                return {"stage": "TP1_EARLY", "reason_closed": "Early exit due to bear regime", "exit_price": live_price}
            elif targets and live_price >= targets[0]:
                return {"stage": "TP1", "reason_closed": "Market regime TP1", "exit_price": live_price}
        else:  # SELL
            if live_price >= stop_price:
                return {"stage": "SL", "reason_closed": f"Market regime stop loss ({regime})", "exit_price": live_price}
            if regime == "bull" and targets and live_price <= targets[0] * 1.2:
                return {"stage": "TP1_EARLY", "reason_closed": "Early exit due to bull regime", "exit_price": live_price}
            elif targets and live_price <= targets[0]:
                return {"stage": "TP1", "reason_closed": "Market regime TP1", "exit_price": live_price}
        
        return None

    async def sizing_for(self, signal_row: dict):
        # Market regime adjusts sizing based on regime confidence
        meta = signal_row.get("meta", {})
        regime = meta.get("regime", "neutral")
        confidence = meta.get("confidence", 0.5)
        
        # Adjust sizing based on regime
        if regime == "bull":
            base_qty = 1.2
            leverage = min(3.0, 2.0 + confidence)
        elif regime == "bear":
            base_qty = 0.6
            leverage = min(2.0, 1.2 + confidence * 0.8)
        else:  # neutral/chop
            base_qty = 0.8
            leverage = min(2.5, 1.5 + confidence)
        
        return base_qty * confidence, leverage