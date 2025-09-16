"""
Telemetry signal dispatchers for Golden Hook X and other strategies.
"""
import os

def announce_entry(*args, **kwargs):
    # existing function preserved - placeholder
    pass

def ghx_entry(symbol, ladder, scores, liq_info):
    from ticklet_ai.services.notifier import send_trade  # adapt to your dispatcher
    zone = " / ".join([f"${p:,.0f}" for p,_ in ladder.levels])
    text = (
        f"🪝 GOLDEN HOOK X | {symbol}\n"
        f"Hook Zone: {zone}\n"
        f"Leverage: ≥{os.getenv('GHX_MIN_LEVERAGE','2.0')}× (No-Liq)\n"
        f"Ideal SL (info only): {liq_info.get('ideal_sl','n/a')} — NOT APPLIED\n"
        f"TS {scores.ts:.0f} | DR {scores.dr:.0f} | HC {scores.hc:.0f}\n"
        f"Volume ≥ ${float(os.getenv('GHX_MIN_VOLUME_USDT','10000000')):,.0f} ✅"
    )
    send_trade(text)

def ghx_trim(symbol, pct, scores):
    from ticklet_ai.services.notifier import send_trade
    send_trade(f"✂️ GHX Trim {int(pct*100)}% | {symbol} | DR {scores.dr:.0f}")

def ghx_exit(symbol, scores, next_hooks):
    from ticklet_ai.services.notifier import send_trade
    nxt = " / ".join([f"${p:,.0f}" for p,_ in getattr(next_hooks, 'levels', [])]) if next_hooks else "pending"
    send_trade(f"🏁 GHX EXIT | {symbol} | DR {scores.dr:.0f} ✓✓ — Re-arming: {nxt}")