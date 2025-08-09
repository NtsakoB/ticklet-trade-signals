from pydantic import BaseModel, Field, validator
from typing import Optional

class PushRequest(BaseModel):
    channel: str = Field(..., description="signals or maintenance")
    text: str = Field(..., min_length=1, max_length=4096)
    image_url: Optional[str] = Field(None, description="Optional HTTPS image URL")

    @validator('channel')
    def channel_must_be_valid(cls, v):
        if v not in {"signals", "maintenance"}:
            raise ValueError("channel must be 'signals' or 'maintenance'")
        return v

class PushResponse(BaseModel):
    ok: bool
    message_id: Optional[str] = None
    channel: Optional[str] = None
    error: Optional[str] = None
