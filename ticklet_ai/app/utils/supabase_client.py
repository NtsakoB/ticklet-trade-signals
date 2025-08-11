import os
from supabase import create_client


def get_supabase():
    url = os.environ["TICKLET_SUPABASE_URL"]
    key = os.environ["TICKLET_SUPABASE_ANON_KEY"]
    return create_client(url, key)
