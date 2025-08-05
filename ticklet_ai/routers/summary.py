# Daily Summary Endpoints
# /summary/daily routes

from fastapi import APIRouter

router = APIRouter(prefix="/summary", tags=["summary"])

@router.get("/daily")
def get_daily_summary():
    return {"message": "Daily summary endpoint"}