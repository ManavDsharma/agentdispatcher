"""Roster writes (bulk upload) and the lookup used to warn about rows that
already exist. Same real-DynamoDB-vs-mock decision as the other repositories,
with one deliberate difference: a *failed* real write is reported, never
silently swapped for the mock store — pretending a roster was saved when it
wasn't would be worse than an error.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Dict, List, Tuple

from app.config import settings
from app.dynamo_utils import json_safe_item
from app.mock_reference_data import add_mock_roster_rows, get_mock_roster
from app.store.dynamo import get_table

logger = logging.getLogger(__name__)

WRITE_CHUNK = 25  # DynamoDB BatchWriteItem limit


class RosterWriteError(Exception):
    def __init__(self, message: str, written: int):
        super().__init__(message)
        self.written = written


def _scan_all(table) -> List[dict]:
    items: List[dict] = []
    kwargs: Dict[str, object] = {}
    while True:
        response = table.scan(**kwargs)
        items.extend(json_safe_item(i) for i in response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        kwargs["ExclusiveStartKey"] = last_key


async def get_existing_rows() -> Tuple[List[dict], dict]:
    """Every roster row currently stored (paginated, unlike the dropdown read)."""
    if not settings.roster_configured:
        return get_mock_roster(), {"source": "mock", "reason": "not_configured", "error": None}
    try:
        items = await asyncio.to_thread(lambda: _scan_all(get_table(settings.roster_table_name)))
        return items, {"source": "dynamodb", "reason": None, "error": None}
    except Exception as exc:
        logger.warning("Roster scan for duplicate check failed: %s", exc)
        return [], {"source": "dynamodb", "reason": "connection_error", "error": str(exc)}


def _put_chunks(items: List[dict]) -> int:
    table = get_table(settings.roster_table_name)
    written = 0
    for start in range(0, len(items), WRITE_CHUNK):
        chunk = items[start : start + WRITE_CHUNK]
        try:
            with table.batch_writer() as batch:
                for item in chunk:
                    batch.put_item(Item=item)
        except Exception as exc:
            raise RosterWriteError(str(exc), written) from exc
        written += len(chunk)
    return written


async def put_rows(items: List[dict]) -> Tuple[int, dict]:
    """Write roster items (each already carrying its UID). Returns (count, meta)."""
    if not settings.roster_configured:
        add_mock_roster_rows(items)
        return len(items), {"source": "mock", "reason": "not_configured", "error": None}

    written = await asyncio.to_thread(_put_chunks, items)
    return written, {"source": "dynamodb", "reason": None, "error": None}
