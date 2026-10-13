"""Orchestration layer between the API routes and the repository. The route
layer should never talk to DynamoDB directly."""

from datetime import datetime, timezone

from app.domain.priority_matrix import compute_priority
from app.domain.ticket import EDITABLE_FIELDS
from app.store import ticket_repository


class TicketNotFoundError(Exception):
    pass


class TicketNotEditableError(Exception):
    pass


async def list_tickets() -> tuple:
    """Returns (tickets_as_api_dicts, meta)."""
    records, meta = await ticket_repository.get_all()
    return [r.to_api_dict() for r in records], meta


async def get_ticket(ticket_id: str) -> dict:
    record = await ticket_repository.get(ticket_id)
    return record.to_api_dict() if record else None


async def update_ticket(ticket_id: str, patch: dict) -> dict:
    record = await ticket_repository.get(ticket_id)
    if record is None:
        raise TicketNotFoundError(f"Ticket {ticket_id} not found")

    if record.management_mode != "internal_edit":
        raise TicketNotEditableError(
            f"{ticket_id} is managed in {record.source_system} — edit it there instead"
        )

    disallowed = set(patch) - EDITABLE_FIELDS
    if disallowed:
        raise ValueError(f"Cannot edit field(s): {', '.join(sorted(disallowed))}")

    # Priority is never client-settable — recompute it from whichever
    # impact/urgency will be in effect after this patch, so it's always
    # consistent with the ServiceNow-style matrix rather than trusted input.
    if "impact" in patch or "urgency" in patch:
        final_impact = patch.get("impact", record.impact)
        final_urgency = patch.get("urgency", record.urgency)
        patch = {**patch, "priority": compute_priority(final_impact, final_urgency)}

    patch = {**patch, "updated_at": datetime.now(timezone.utc).isoformat()}
    updated = ticket_repository.update_fields(ticket_id, patch)
    return updated.to_api_dict()
