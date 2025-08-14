from fastapi import APIRouter
from pydantic import BaseModel
from ..services.settings_store import get_settings, set_settings

router = APIRouter(prefix="/settings", tags=["settings"])

class Patch(BaseModel):
    volume_filter: float | None = None
    risk_per_trade: float | None = None

@router.get("")
def read():
    return get_settings()

@router.put("")
def write(p: Patch):
    data = {k: v for k, v in p.dict().items() if v is not None}
    return set_settings(data)