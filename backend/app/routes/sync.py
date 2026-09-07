from fastapi import APIRouter, HTTPException

from app.services import sync_service

router = APIRouter(prefix="/api", tags=["sync"])


@router.post("/sync/{source}")
async def trigger_sync(source: str):
    try:
        return await sync_service.sync_platform(source)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
