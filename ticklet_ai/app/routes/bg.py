from fastapi import APIRouter
import os
from ..schemas.common import MessageResponse

router = APIRouter(prefix="/bg", tags=["Background"])

@router.get("/status", response_model=MessageResponse)
def status():
    return {"message": (
      f"enabled={os.getenv('TICKLET_BG_ENABLED','true')}, "
      f"interval={os.getenv('TICKLET_BG_INTERVAL_SEC','60')}s, "
      f"symbols={os.getenv('TICKLET_SYMBOLS','any')}, "
      f"timeframes={os.getenv('TICKLET_TIMEFRAMES','15m,30m,1h,1d')}, "
      f"supabase={'on' if (os.getenv('TICKLET_SUPABASE_URL') and os.getenv('TICKLET_SUPABASE_ANON_KEY')) else 'off'}"
    )}