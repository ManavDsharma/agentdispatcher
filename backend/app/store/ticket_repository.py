"""The only module that decides where ticket data actually comes from.

Mirrors the fallback philosophy already used for ServiceNow: if DynamoDB isn't
configured, or a call to it fails, fall back to the in-memory mock dataset
rather than showing an empty/broken page.
"""

import logging
from typing import Optional

from app.config import settings
from app.domain.ticket import TicketRecord
from app.mock_data import get_mock_ticket, get_mock_tickets
from app.store.dynamo import get_table

logger = logging.getLogger(__name__)


class TicketRepositoryError(Exception):
    pass


async def get_all() -> tuple:
    """Returns (records, meta) where meta mirrors the {source, reason, error}
    shape the frontend already knows how to render a banner for."""
    if not settings.dynamodb_configured:
        return get_mock_tickets(), {"source": "mock", "reason": "not_configured", "error": None}

    try:
        response = get_table().scan()
        records = [TicketRecord.from_item(item) for item in response.get("Items", [])]
        return records, {"source": "dynamodb", "reason": None, "error": None}
    except Exception as exc:  # boto3 raises various botocore.exceptions types
        logger.warning("DynamoDB scan failed, falling back to mock tickets: %s", exc)
        return get_mock_tickets(), {"source": "mock", "reason": "connection_error", "error": str(exc)}


async def get(ticket_id: str) -> Optional[TicketRecord]:
    if not settings.dynamodb_configured:
        return get_mock_ticket(ticket_id)

    try:
        response = get_table().get_item(Key={"id": ticket_id})
        item = response.get("Item")
        return TicketRecord.from_item(item) if item else None
    except Exception as exc:
        logger.warning("DynamoDB get_item failed, falling back to mock tickets: %s", exc)
        return get_mock_ticket(ticket_id)


def upsert(record: TicketRecord) -> None:
    if not settings.dynamodb_configured:
        raise TicketRepositoryError("DynamoDB is not configured — cannot persist sync results")
    get_table().put_item(Item=record.to_item())


def update_fields(ticket_id: str, patch: dict) -> None:
    if not settings.dynamodb_configured:
        raise TicketRepositoryError("DynamoDB is not configured — cannot persist edits")

    update_expr = "SET " + ", ".join(f"#{key} = :{key}" for key in patch)
    get_table().update_item(
        Key={"id": ticket_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames={f"#{key}": key for key in patch},
        ExpressionAttributeValues={f":{key}": value for key, value in patch.items()},
    )
