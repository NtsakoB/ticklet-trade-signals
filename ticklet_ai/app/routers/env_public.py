from fastapi import APIRouter, Response
from ...conf.env import SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_URL

router = APIRouter()

@router.get("/env.js")
async def env_js():
    # expose ONLY non-secret, client-usable values
    js = (
        "window.__ENV__ = window.__ENV__ || {};\n"
        f"window.__ENV__.SUPABASE_URL = {SUPABASE_URL!r};\n"
        f"window.__ENV__.SUPABASE_ANON_KEY = {SUPABASE_ANON_KEY!r};\n"
        f"window.__ENV__.BACKEND_URL = {BACKEND_URL!r};\n"
    )
    return Response(content=js, media_type="application/javascript")