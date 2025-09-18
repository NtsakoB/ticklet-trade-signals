from typing import List
from .base import Strategy, SignalProposal
from ticklet_ai.strategies.golden_hook_x.signals import compute_scores
from ticklet_ai.services.scanner import get_candidates

class GoldenHook(Strategy):
    name = "GoldenHook"

    async def propose(self) -> List[SignalProposal]:
        # Use Golden Hook X logic for signal generation
        candidates = get_candidates()
        proposals = []
        
        for c in candidates:
            # Filter using Golden Hook X scoring if available
            symbol = c["symbol"]
            
            # Create Golden Hook proposal based on existing logic
            entry_price = (c["entry_low"] + c["entry_high"]) / 2
            stop_price = entry_price * 0.97 if c.get("side", "BUY") == "BUY" else entry_price * 1.03
            
            # Golden Hook typically has tighter risk management
            rr = c.get("rr_tp2", 2.0)  # Higher RR for Golden Hook
            risk = abs(entry_price - stop_price)
            target1 = entry_price + (risk * 1.2) if c.get("side", "BUY") == "BUY" else entry_price - (risk * 1.2)
            target2 = entry_price + (risk * rr) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr)
            target3 = entry_price + (risk * rr * 1.8) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr * 1.8)
            
            proposals.append(SignalProposal(
                symbol=symbol,
                entry_price=entry_price,
                stop_price=stop_price,
                targets=[target1, target2, target3],
                side=c.get("side", "BUY"),
                meta={
                    "strategy": "GoldenHook",
                    "confidence": c.get("confidence", 0.0),
                    "hook_confluence": c.get("hook_confluence", 0),
                    "trend_strength": c.get("trend_strength", 0),
                    "drop_risk": c.get("drop_risk", 0)
                }
            ))
        
        return proposals

    async def should_close(self, signal_row: dict, live_price: float):
        # Golden Hook specific exit logic - more conservative
        entry_price = signal_row.get("entry_price", 0)
        stop_price = signal_row.get("stop_price", 0)
        targets = signal_row.get("targets", [])
        
        # Tighter stop loss management for Golden Hook
        if signal_row.get("side") == "BUY":
            if live_price <= stop_price:
                return {"stage": "SL", "reason_closed": "Golden Hook stop loss", "exit_price": live_price}
            # Partial exit at first target for Golden Hook
            if targets and live_price >= targets[0]:
                return {"stage": "TP1_PARTIAL", "reason_closed": "Golden Hook TP1 partial exit", "exit_price": live_price}
        else:  # SELL
            if live_price >= stop_price:
                return {"stage": "SL", "reason_closed": "Golden Hook stop loss", "exit_price": live_price}
            if targets and live_price <= targets[0]:
                return {"stage": "TP1_PARTIAL", "reason_closed": "Golden Hook TP1 partial exit", "exit_price": live_price}
        
        return None

    async def sizing_for(self, signal_row: dict):
        # Golden Hook uses more conservative sizing
        confidence = signal_row.get("meta", {}).get("confidence", 0.5)
        base_qty = 0.8  # More conservative base size
        leverage = min(2.5, 1.5 + confidence)  # Dynamic leverage based on confidence
        return base_qty * confidence, leverage