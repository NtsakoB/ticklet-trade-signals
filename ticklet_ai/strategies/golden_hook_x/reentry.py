"""
Re-entry planner: build ladders at 0.382/0.5/0.618, snapped to VPVR nodes / structure.
"""
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class Ladder:
    levels: List[Tuple[float, float]]  # (price, size_pct)

def build_ladder(kl, vpvr, bias_deeper: bool = True) -> Ladder:
    swing = kl.last_impulse()  # (low, high)
    f382 = swing.fib(0.382); f50 = swing.fib(0.5); f618 = swing.fib(0.618)
    l1 = vpvr.snap_to_hvn(f382) if vpvr else f382
    l2 = vpvr.snap_to_hvn(f50)  if vpvr else f50
    l3 = vpvr.snap_to_hvn(f618) if vpvr else f618
    return Ladder(levels=[(l1,0.20),(l2,0.30),(l3,0.50)] if bias_deeper else [(l1,0.33),(l2,0.33),(l3,0.34)])