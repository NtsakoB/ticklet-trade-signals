import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

PREVIEW_MODE = os.getenv("PREVIEW_MODE", "false").lower() == "true"

class PreviewBypassMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if PREVIEW_MODE:
            # Stamp a faux user identity; your route guards can read this.
            request.state.preview_user = {"id": "preview", "role": "admin"}
        return await call_next(request)