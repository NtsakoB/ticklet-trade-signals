import os
from supabase import create_client

SUPABASE_URL = os.getenv("TICKLET_SUPABASE_URL") or os.getenv("SUPABASE_URL")
# Prefer service role for server writes; fall back to anon if needed.
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("TICKLET_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")

def get_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    return create_client(SUPABASE_URL, SUPABASE_KEY)