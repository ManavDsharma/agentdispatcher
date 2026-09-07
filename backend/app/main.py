import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.integrations import servicenow
from app.routes import sync, tickets
from app.services import sync_service

logger = logging.getLogger(__name__)

app = FastAPI(title="Agentic Support Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(sync.router)


@app.on_event("startup")
async def sync_on_startup():
    """Best-effort initial pull so the app has fresh data (and an accurate
    ServiceNow status dot) without waiting on Phase B's scheduler."""
    try:
        await sync_service.sync_platform("servicenow")
    except Exception:
        logger.exception("Startup ServiceNow sync failed — continuing without it")


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "servicenow": servicenow.get_status(),
    }
