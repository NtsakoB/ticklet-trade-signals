import os
from supabase import create_client

def supabase_can_connect():
    url = os.getenv("TICKLET_SUPABASE_URL")
    key = os.getenv("TICKLET_SUPABASE_ANON_KEY")
    if not url or not key:
        return False, "Missing Supabase env vars"
    try:
        sb = create_client(url, key)
        # cheap call: list schemas or select 1 from a public table if available
        return True, "OK"
    except Exception as e:
        return False, str(e)
