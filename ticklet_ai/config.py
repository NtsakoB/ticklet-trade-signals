import os, logging
from dataclasses import dataclass
logger = logging.getLogger(__name__)

# Helper to mask secrets in logs
def _mask(val: str|None):
    if not val: return "<empty>"
    if len(val) <= 8: return "****"
    return val[:4] + "…" + val[-4:]

@dataclass
class Settings:
    # Core
    APP_ENV: str = os.getenv('APP_ENV', 'prod')
    TZ: str = os.getenv('TZ', 'Africa/Johannesburg')

    # Feature toggles
    AI_ENABLED: str = os.getenv('AI_ENABLED', 'true')
    ENABLE_AI_TRAINING: str = os.getenv('ENABLE_AI_TRAINING', 'true')
    ENABLE_PAPER_TRADING: str = os.getenv('ENABLE_PAPER_TRADING', 'true')
    ENABLE_TELEGRAM: str = os.getenv('ENABLE_TELEGRAM', 'false')

    # Schedulers
    SCAN_INTERVAL_CRON: str = os.getenv('SCAN_INTERVAL_CRON', '*/1 * * * *')
    TRAINING_CRON: str = os.getenv('TRAINING_CRON', '0 */3 * * *')
    SIGNAL_LOOP_INTERVAL: str = os.getenv('SIGNAL_LOOP_INTERVAL', '60')

    # Supabase (Render keys per screenshots)
    SUPABASE_URL: str|None = os.getenv('TICKLET_SUPABASE_URL') or os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY: str|None = os.getenv('TICKLET_SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
    SUPABASE_SERVICE_ROLE_KEY: str|None = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

    # Binance
    BINANCE_KEY: str|None = os.getenv('TICKLET_BINANCE_KEY')
    BINANCE_SECRET: str|None = os.getenv('TICKLET_BINANCE_SECRET')

    # OpenAI
    OPENAI_KEY: str|None = os.getenv('TICKLET_OPENAI_KEY')

    # Telegram/Pusher (kept but optional)
    TELEGRAM_BOT_TOKEN: str|None = os.getenv('TELEGRAM_BOT_TOKEN')
    TELEGRAM_CHAT_ID_CHAT_BOT: str|None = os.getenv('TELEGRAM_CHAT_ID_CHAT_BOT')
    TELEGRAM_CHAT_ID_MAINTENANCE: str|None = os.getenv('TELEGRAM_CHAT_ID_MAINTENANCE')
    TELEGRAM_CHAT_ID_TRADING: str|None = os.getenv('TELEGRAM_CHAT_ID_TRADING')
    TELEGRAM_PUSHER_URL: str|None = os.getenv('TELEGRAM_PUSHER_URL')
    TELEGRAM_PUSHER_SHARED_SECRET: str|None = os.getenv('TELEGRAM_PUSHER_SHARED_SECRET')
    TICKLET_TELEGRAM_API_ID: str|None = os.getenv('TICKLET_TELEGRAM_API_ID')
    TICKLET_TELEGRAM_API_HASH: str|None = os.getenv('TICKLET_TELEGRAM_API_HASH')

    # Strategy knobs
    VOLUME_FILTER_MIN: str|None = os.getenv('VOLUME_FILTER_MIN')
    AI_EXTEND_PROB_MIN: str|None = os.getenv('AI_EXTEND_PROB_MIN')
    AI_LATE_ENTRY_PROB_MIN: str|None = os.getenv('AI_LATE_ENTRY_PROB_MIN')
    AI_REENTRY_PROB_MIN: str|None = os.getenv('AI_REENTRY_PROB_MIN')
    MAX_CONCURRENT_TRADES: str|None = os.getenv('MAX_CONCURRENT_TRADES')
    MAX_OVEREXTENSION_ATR: str|None = os.getenv('MAX_OVEREXTENSION_ATR')
    MIN_RR_TP2: str|None = os.getenv('MIN_RR_TP2')

    # Misc (present in UI)
    BACKEND_URL: str|None = os.getenv('BACKEND_URL')

    def validate(self):
        errors = []
        # Strict requirements for backend worker + storage
        if not self.SUPABASE_URL: errors.append('TICKLET_SUPABASE_URL (or SUPABASE_URL) is required')
        if not self.SUPABASE_SERVICE_ROLE_KEY: errors.append('SUPABASE_SERVICE_ROLE_KEY is required (server writes)')
        if not self.BINANCE_KEY: errors.append('TICKLET_BINANCE_KEY is required for market data')
        if not self.BINANCE_SECRET: errors.append('TICKLET_BINANCE_SECRET is required for market data')
        if errors:
            for e in errors: logger.error('ENV MISSING: %s', e)
            raise RuntimeError('Missing required environment variables: ' + ', '.join(errors))

        # Log a masked summary so we can confirm keys without leaking secrets
        logger.info('ENV OK | TZ=%s | CRON scan=%s train=%s | AI_ENABLED=%s PT=%s AI_TRAIN=%s',
            self.TZ, self.SCAN_INTERVAL_CRON, self.TRAINING_CRON, self.AI_ENABLED, self.ENABLE_PAPER_TRADING, self.ENABLE_AI_TRAINING)
        logger.info('SUPABASE_URL=%s | ANON=%s | SERVICE=%s', _mask(self.SUPABASE_URL), _mask(self.SUPABASE_ANON_KEY), _mask(self.SUPABASE_SERVICE_ROLE_KEY))
        logger.info('BINANCE_KEY=%s | OPENAI=%s | TELEGRAM=%s', _mask(self.BINANCE_KEY), _mask(self.OPENAI_KEY), self.ENABLE_TELEGRAM)

settings = Settings()