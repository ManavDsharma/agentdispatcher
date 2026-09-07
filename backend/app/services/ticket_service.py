"""Orchestration layer between the API routes and the repository. The route
layer should never import a connector or talk to DynamoDB directly."""

from app.store import ticket_repository


async def list_tickets() -> tuple:
    """Returns (tickets_as_api_dicts, meta)."""
    records, meta = await ticket_repository.get_all()
    return [r.to_api_dict() for r in records], meta


async def get_ticket(ticket_id: str) -> dict:
    record = await ticket_repository.get(ticket_id)
    return record.to_api_dict() if record else None
