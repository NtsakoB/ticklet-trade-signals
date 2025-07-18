# Feedback and Logging Endpoints
# /feedback/log routes

from fastapi import APIRouter

router = APIRouter(prefix="/feedback", tags=["feedback"])

@router.post("/log")
def log_feedback():
    return {"message": "Feedback logging endpoint"}