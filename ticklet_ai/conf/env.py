import os

def _bool(name: str, default: bool=False) -> bool:
    v = os.getenv(name)
    if v is None: return default
    return str(v).strip().lower() in ("1","true","yes","on")

# === OpenAI (match your keys, with safe fallbacks) ===
OPENAI_KEY   = os.getenv("TICKLET_OPENAI_KEY") or os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# === Supabase (server-side only) ===
SUPABASE_URL      = os.getenv("TICKLET_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("TICKLET_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
# service role key stays server-only, never exposed to FE
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# === Toggles ===
AI_ENABLED = _bool("AI_ENABLED", True)
ENABLE_AI_TRAINING = _bool("ENABLE_AI_TRAINING", True)
ENABLE_PAPER_TRADING = _bool("ENABLE_PAPER_TRADING", False)
ENABLE_TELEGRAM = _bool("ENABLE_TELEGRAM", False)

# === Optional backend URL for FE helpers ===
BACKEND_URL = os.getenv("BACKEND_URL", "")

# === Paths ===
TICKLET_DATA_DIR   = os.getenv("TICKLET_DATA_DIR", "./data")
TICKLET_MODELS_DIR = os.getenv("TICKLET_MODELS_DIR", "./data/models")
TICKLET_LOGS_DIR   = os.getenv("TICKLET_LOGS_DIR", "./data/logs")