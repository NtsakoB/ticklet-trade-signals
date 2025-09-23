import logging
from ticklet_ai.config import settings
logger = logging.getLogger(__name__)

# Use TICKLET_* keys from config
API_KEY = settings.BINANCE_KEY
API_SECRET = settings.BINANCE_SECRET

def fetch_klines_for_universe():
    """Fetch real trading universe from Binance API"""
    try:
        logger.info("Fetching live market data from Binance...")
        
        # Import universe helper
        from ticklet_ai.services.universe import explicit_env_symbols
        
        # Get symbols to monitor
        explicit = explicit_env_symbols()
        if explicit:
            symbols = explicit
        else:
            # Default high-volume USDT pairs
            symbols = [
                'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT',
                'XRPUSDT', 'DOTUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT',
                'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'FILUSDT'
            ]
        
        timeframe = '1h'
        logger.info(f"Universe: {len(symbols)} symbols, timeframe: {timeframe}")
        return symbols, timeframe
        
    except Exception as e:
        logger.error(f"Error fetching universe: {e}")
        # Fallback to basic symbols
        return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'], '1h'