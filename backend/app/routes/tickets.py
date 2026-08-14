from fastapi import APIRouter

from app.config import settings
from app.integrations import servicenow
from app.mapping.ticket_mapper import map_incident
from app.mock_data import get_mock_tickets

router = APIRouter(prefix="/api", tags=["tickets"])


@router.get("/tickets")
async def list_tickets():
    if not settings.servicenow_configured:
        return {"tickets": get_mock_tickets(), "source": "mock", "reason": "not_configured", "error": None}

    try:
        raw_incidents = await servicenow.get_incidents(limit=50)
    except servicenow.ServiceNowError as exc:
        return {
            "tickets": get_mock_tickets(),
            "source": "mock",
            "reason": "connection_error",
            "error": str(exc),
        }

    tickets = [map_incident(record) for record in raw_incidents]
    return {"tickets": tickets, "source": "servicenow", "reason": None, "error": None}
