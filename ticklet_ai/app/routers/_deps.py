from supabase import create_client, Client
from ...conf.env import SUPABASE_URL, SUPABASE_ANON_KEY

_sb: Client | None = None

def get_supabase_client() -> Client:
    global _sb
    if _sb is None:
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise RuntimeError("Missing TICKLET_SUPABASE_URL / TICKLET_SUPABASE_ANON_KEY")
        _sb = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    return _sb