import os
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("TICKLET_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE")
    or os.getenv("TICKLET_SUPABASE_ANON_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
)

_supabase_client: Optional[Client] = None

def get_client():
    """Legacy function - use get_supabase_client() instead"""
    return get_supabase_client()

def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global _supabase_client
    
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase URL and KEY must be set in environment variables")
        
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized")
    
    return _supabase_client