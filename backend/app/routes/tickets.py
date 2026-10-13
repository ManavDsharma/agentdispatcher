from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services import ticket_service

router = APIRouter(prefix="/api", tags=["tickets"])


class TicketPatch(BaseModel):
    short_description: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    urgency: Optional[str] = None
    impact: Optional[str] = None
    state: Optional[str] = None
    assigned_to: Optional[str] = None
    opened_by: Optional[str] = None
    opened_for: Optional[str] = None
    team_id: Optional[str] = None
    working_notes: Optional[str] = None


@router.get("/tickets")
async def list_tickets():
    tickets, meta = await ticket_service.list_tickets()
    return {"tickets": tickets, **meta}


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str):
    ticket = await ticket_service.get_ticket(ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, payload: TicketPatch):
    patch = payload.model_dump(exclude_unset=True)
    if not patch:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        return await ticket_service.update_ticket(ticket_id, patch)
    except ticket_service.TicketNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ticket_service.TicketNotEditableError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
