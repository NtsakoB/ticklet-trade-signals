from fastapi import APIRouter, Response

router = APIRouter(prefix="/api", tags=["compat"])

@router.get("/missed-opportunities")
async def missed_redirect():
    return Response(status_code=307, headers={"Location": "/api/signals?type=missed"})

@router.get("/lowest-price")
async def lowest_redirect():
    return Response(status_code=307, headers={"Location": "/api/signals?type=lowest"})