import logging, time
from ticklet_ai.utils.telegram_dispatcher import send_telegram_message
from ticklet_ai.utils.store import store_scan_summary, store_signals_batch
from ticklet_ai.data.binance import fetch_klines_for_universe
from ticklet_ai.logic.signals import generate_signals
from ticklet_ai.logic.execute import maybe_open_paper_trades
logger = logging.getLogger(__name__)

def scan_and_send_signals():
    t0 = time.time()
    symbols, timeframe = fetch_klines_for_universe()
    signals = generate_signals(symbols, timeframe)
    store_signals_batch(signals)
    opened = maybe_open_paper_trades(signals)
    try:
        send_telegram_message('maintenance', f'Scan ok. syms={len(symbols)} pass={len(signals)} open={opened}')
    except Exception as e:
        logger.debug(f'telegram suppressed: {e}')
    summary = {
        'symbols_total': len(symbols),
        'passed_filters': len(signals),
        'signals_count': len(signals),
        'trades_opened': opened,
        'duration_ms': int((time.time()-t0)*1000)
    }
    store_scan_summary(summary)
    logger.info('SCAN: %s', summary)
    return summary