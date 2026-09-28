from fastapi import APIRouter

from app.services import reference_service

router = APIRouter(prefix="/api/reference", tags=["reference"])


@router.get("/categorization-matrix")
async def get_categorization_matrix():
    items, meta = await reference_service.list_categorization_matrix()
    return {"items": items, **meta}


@router.get("/roster")
async def get_roster():
    items, meta = await reference_service.list_roster()
    return {"items": items, **meta}
