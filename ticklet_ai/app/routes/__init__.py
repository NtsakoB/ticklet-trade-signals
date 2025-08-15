from fastapi import APIRouter
from .pusher import router as pusher_router

api = APIRouter()
api.include_router(pusher_router)