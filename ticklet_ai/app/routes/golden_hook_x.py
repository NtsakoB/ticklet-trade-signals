from fastapi import APIRouter
import os, json

router = APIRouter(prefix="/ghx", tags=["GoldenHookX"])

@router.get("/status")
def status():
    return {
        "enabled": os.getenv("GHX_ENABLED","true"),
        "symbols": os.getenv("GHX_SYMBOLS","ETHUSDT"),
        "thresholds": json.loads(os.getenv("GHX_THRESHOLDS","{}")),
        "safety": json.loads(os.getenv("GHX_SAFETY","{}")),
    }