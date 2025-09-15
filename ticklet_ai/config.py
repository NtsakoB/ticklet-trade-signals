import os, logging
from dataclasses import dataclass
logger = logging.getLogger(__name__)
def _mask(v: str | None): 
    if not v: return "<empty>"
    return (v[:4] + "…" + v[-4:]) if len(v) > 8 else "****"

@dataclass
class Settings:
    # core
    APP_ENV: str = os.getenv("APP_ENV", "prod")
    TZ: str = os.getenv("TZ", "Africa/Johannesburg")

    # toggles
    AI_ENABLED: str = os.getenv("AI_ENABLED", "true")
    ENABLE_AI_TRAINING: str = os.getenv("ENABLE_AI_TRAINING", "true")
    ENABLE_PAPER_TRADING: str = os.getenv("ENABLE_PAPER_TRADING", "true")
    ENABLE_TELEGRAM: str = os.getenv("ENABLE_TELEGRAM", "false")

    # schedules
    SCAN_INTERVAL_CRON: str = os.getenv("SCAN_INTERVAL_CRON", "*/1 * * * *")
    TRAINING_CRON: str = os.getenv("TRAINING_CRON", "0 */3 * * *")
    SIGNAL_LOOP_INTERVAL: str = os.getenv("SIGNAL_LOOP_INTERVAL", "60")

    # supabase (Render keys you showed)
    SUPABASE_URL: str | None = os.getenv("TICKLET_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str | None = os.getenv("TICKLET_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

    # binance
    BINANCE_KEY: str | None = os.getenv("TICKLET_BINANCE_KEY")
    BINANCE_SECRET: str | None = os.getenv("TICKLET_BINANCE_SECRET")

    # openai
    OPENAI_KEY: str | None = os.getenv("TICKLET_OPENAI_KEY")

    # telegram (kept but optional)
    TELEGRAM_BOT_TOKEN: str | None = os.getenv("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID_CHAT_BOT: str | None = os.getenv("TELEGRAM_CHAT_ID_CHAT_BOT")
    TELEGRAM_CHAT_ID_MAINTENANCE: str | None = os.getenv("TELEGRAM_CHAT_ID_MAINTENANCE")
    TELEGRAM_CHAT_ID_TRADING: str | None = os.getenv("TELEGRAM_CHAT_ID_TRADING")
    TELEGRAM_PUSHER_URL: str | None = os.getenv("TELEGRAM_PUSHER_URL")
    TELEGRAM_PUSHER_SHARED_SECRET: str | None = os.getenv("TELEGRAM_PUSHER_SHARED_SECRET")
    TICKLET_TELEGRAM_API_ID: str | None = os.getenv("TICKLET_TELEGRAM_API_ID")
    TICKLET_TELEGRAM_API_HASH: str | None = os.getenv("TICKLET_TELEGRAM_API_HASH")

    # misc knobs
    VOLUME_FILTER_MIN: str | None = os.getenv("VOLUME_FILTER_MIN")
    AI_EXTEND_PROB_MIN: str | None = os.getenv("AI_EXTEND_PROB_MIN")
    AI_LATE_ENTRY_PROB_MIN: str | None = os.getenv("AI_LATE_ENTRY_PROB_MIN")
    AI_REENTRY_PROB_MIN: str | None = os.getenv("AI_REENTRY_PROB_MIN")
    MAX_CONCURRENT_TRADES: str | None = os.getenv("MAX_CONCURRENT_TRADES")
    MAX_OVEREXTENSION_ATR: str | None = os.getenv("MAX_OVEREXTENSION_ATR")
    MIN_RR_TP2: str | None = os.getenv("MIN_RR_TP2")
    BACKEND_URL: str | None = os.getenv("BACKEND_URL")

    def validate_web(self):
        # Warn only; never kill the web
        if not self.SUPABASE_URL:
            logger.warning("ENV WARN (web): TICKLET_SUPABASE_URL/SUPABASE_URL missing.")
        if not self.SUPABASE_ANON_KEY:
            logger.warning("ENV WARN (web): TICKLET_SUPABASE_ANON_KEY/SUPABASE_ANON_KEY missing.")
        logger.info("WEB ENV | TZ=%s | scan=%s train=%s | AI=%s PT=%s AI_TRAIN=%s",
                    self.TZ, self.SCAN_INTERVAL_CRON, self.TRAINING_CRON,
                    self.AI_ENABLED, self.ENABLE_PAPER_TRADING, self.ENABLE_AI_TRAINING)
        logger.info("WEB SUPABASE_URL=%s | ANON=%s | SERVICE? %s",
                    _mask(self.SUPABASE_URL), _mask(self.SUPABASE_ANON_KEY), bool(self.SUPABASE_SERVICE_ROLE_KEY))

    def validate_worker(self):
        errs = []
        if not self.SUPABASE_URL: errs.append("TICKLET_SUPABASE_URL (or SUPABASE_URL)")
        if not self.SUPABASE_SERVICE_ROLE_KEY: errs.append("SUPABASE_SERVICE_ROLE_KEY")
        if not self.BINANCE_KEY: errs.append("TICKLET_BINANCE_KEY")
        if not self.BINANCE_SECRET: errs.append("TICKLET_BINANCE_SECRET")
        if errs:
            raise RuntimeError("Missing required env for worker: " + ", ".join(errs))
        logger.info("WORKER ENV OK | TZ=%s | scan=%s train=%s", self.TZ, self.SCAN_INTERVAL_CRON, self.TRAINING_CRON)

settings = Settings()