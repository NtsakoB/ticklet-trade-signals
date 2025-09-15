import os, logging
logger = logging.getLogger(__name__)

ENABLE_PAPER_TRADING = os.getenv('ENABLE_PAPER_TRADING', 'true').lower() == 'true'

def maybe_open_paper_trades(signals):
    """Open paper trades if enabled"""
    if not ENABLE_PAPER_TRADING:
        logger.debug("Paper trading disabled")
        return 0
    
    opened = 0
    for signal in signals:
        if signal.get('confidence', 0) > 0.7:
            logger.info(f"Opening paper trade for {signal['symbol']}")
            opened += 1
    
    return opened