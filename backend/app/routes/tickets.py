from fastapi import APIRouter, HTTPException

from app.services import ticket_service

router = APIRouter(prefix="/api", tags=["tickets"])


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
