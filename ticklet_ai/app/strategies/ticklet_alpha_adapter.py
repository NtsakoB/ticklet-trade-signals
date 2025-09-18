from typing import List
from .base import Strategy, SignalProposal
from ticklet_ai.services.scanner import get_candidates
from ticklet_ai.services.signal_filter import rideout_should_alert

class TickletAlpha(Strategy):
    name = "TickletAlpha"

    async def propose(self) -> List[SignalProposal]:
        # Use existing scanner logic
        candidates = get_candidates()
        proposals = []
        
        for c in candidates:
            # Convert scanner candidates to SignalProposal format
            # Calculate targets from entry and stop
            entry_price = (c["entry_low"] + c["entry_high"]) / 2
            stop_price = entry_price * 0.98 if c.get("side", "BUY") == "BUY" else entry_price * 1.02
            
            # Generate targets based on RR ratio
            rr = c.get("rr_tp2", 1.8)
            risk = abs(entry_price - stop_price)
            target1 = entry_price + (risk * 1.0) if c.get("side", "BUY") == "BUY" else entry_price - (risk * 1.0)
            target2 = entry_price + (risk * rr) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr)
            target3 = entry_price + (risk * rr * 1.5) if c.get("side", "BUY") == "BUY" else entry_price - (risk * rr * 1.5)
            
            proposals.append(SignalProposal(
                symbol=c["symbol"],
                entry_price=entry_price,
                stop_price=stop_price,
                targets=[target1, target2, target3],
                side=c.get("side", "BUY"),
                meta={
                    "confidence": c.get("confidence", 0.0),
                    "rr_tp2": c.get("rr_tp2", 1.8),
                    "volume": c.get("volume", 0),
                    "late_p": c.get("late_p"),
                    "extend_p": c.get("extend_p"),
                    "reentry_p": c.get("reentry_p"),
                    "overext_atr": c.get("overext_atr")
                }
            ))
        
        return proposals

    async def should_close(self, signal_row: dict, live_price: float):
        # Use existing signal filter logic to determine if signal should close
        entry_price = signal_row.get("entry_price", 0)
        stop_price = signal_row.get("stop_price", 0)
        targets = signal_row.get("targets", [])
        meta = signal_row.get("meta", {})
        
        # Check if stop loss hit
        if signal_row.get("side") == "BUY":
            if live_price <= stop_price:
                return {"stage": "SL", "reason_closed": "Stop loss hit", "exit_price": live_price}
            # Check targets
            if targets and live_price >= targets[0]:
                return {"stage": "TP1", "reason_closed": "Target 1 reached", "exit_price": live_price}
        else:  # SELL
            if live_price >= stop_price:
                return {"stage": "SL", "reason_closed": "Stop loss hit", "exit_price": live_price}
            if targets and live_price <= targets[0]:
                return {"stage": "TP1", "reason_closed": "Target 1 reached", "exit_price": live_price}
        
        return None

    async def sizing_for(self, signal_row: dict):
        # Basic position sizing - can be enhanced with dynamic leverage
        return 1.0, 2.0  # qty, leverage