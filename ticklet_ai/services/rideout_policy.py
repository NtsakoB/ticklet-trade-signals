import os

class Policy:
    ai_enabled = os.getenv("AI_ENABLED","true").lower()=="true"
    late_entry_prob_min = float(os.getenv("AI_LATE_ENTRY_PROB_MIN", 0.55))
    extend_prob_min     = float(os.getenv("AI_EXTEND_PROB_MIN",    0.60))
    reentry_prob_min    = float(os.getenv("AI_REENTRY_PROB_MIN",   0.58))
    max_overextension_atr = float(os.getenv("MAX_OVEREXTENSION_ATR", 3.0))
    min_rr_tp2 = float(os.getenv("MIN_RR_TP2", 1.5))

policy = Policy()