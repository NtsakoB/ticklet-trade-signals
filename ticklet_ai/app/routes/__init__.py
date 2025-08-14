from fastapi import APIRouter
from .settings import router as settings_router

api = APIRouter()
api.include_router(settings_router)