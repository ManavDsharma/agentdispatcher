from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.integrations import servicenow
from app.routes import tickets

app = FastAPI(title="Agentic Support Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "servicenow": servicenow.get_status(),
    }
