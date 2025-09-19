from fastapi import APIRouter
from .pusher import router as pusher_router
from .signals import router as signals_router

api = APIRouter()
api.include_router(pusher_router)
api.include_router(signals_router)