"""The only module that decides where ticket data actually comes from.

DynamoDB is the source of truth; if it isn't configured, or a call to it
fails, fall back to the in-memory mock dataset rather than showing an
empty/broken page. Nothing in this app ingests or syncs into DynamoDB —
that happens externally; we only read, and write back a small edit surface.
"""

import logging
from typing import Optional

from app.config import settings
from app.domain.ticket import TicketRecord
from app.mock_data import get_mock_ticket, get_mock_tickets, update_mock_ticket
from app.store.dynamo import get_table

logger = logging.getLogger(__name__)


def _table():
    return get_table(settings.dynamodb_table_name)


async def get_all() -> tuple:
    """Returns (records, meta) where meta mirrors the {source, reason, error}
    shape the frontend already knows how to render a banner for."""
    if not settings.dynamodb_configured:
        return get_mock_tickets(), {"source": "mock", "reason": "not_configured", "error": None}

    try:
        response = _table().scan()
        records = [TicketRecord.from_item(item) for item in response.get("Items", [])]
        return records, {"source": "dynamodb", "reason": None, "error": None}
    except Exception as exc:  # boto3 raises various botocore.exceptions types
        logger.warning("DynamoDB scan failed, falling back to mock tickets: %s", exc)
        return get_mock_tickets(), {"source": "mock", "reason": "connection_error", "error": str(exc)}


async def get(ticket_id: str) -> Optional[TicketRecord]:
    if not settings.dynamodb_configured:
        return get_mock_ticket(ticket_id)

    try:
        response = _table().get_item(Key={"ticket_id": ticket_id})
        item = response.get("Item")
        return TicketRecord.from_item(item) if item else None
    except Exception as exc:
        logger.warning("DynamoDB get_item failed, falling back to mock tickets: %s", exc)
        return get_mock_ticket(ticket_id)


def update_fields(ticket_id: str, patch: dict) -> TicketRecord:
    if not settings.dynamodb_configured:
        return update_mock_ticket(ticket_id, patch)

    try:
        update_expr = "SET " + ", ".join(f"#{key} = :{key}" for key in patch)
        _table().update_item(
            Key={"ticket_id": ticket_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames={f"#{key}": key for key in patch},
            ExpressionAttributeValues={f":{key}": value for key, value in patch.items()},
        )
        response = _table().get_item(Key={"ticket_id": ticket_id})
        return TicketRecord.from_item(response["Item"])
    except Exception as exc:
        logger.warning("DynamoDB update_item failed, applying edit to mock tickets instead: %s", exc)
        return update_mock_ticket(ticket_id, patch)
