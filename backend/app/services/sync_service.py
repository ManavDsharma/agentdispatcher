"""Pulls tickets from a registered connector and upserts them into the repository.

One normalizer per platform (the connector's map_to_internal) is reused by
both this polling path and, later, a webhook path — see CLAUDE.md/plan.
"""

import logging
from datetime import datetime, timezone

from app.config import settings
from app.connectors.registry import CONNECTORS
from app.store import ticket_repository

logger = logging.getLogger(__name__)


async def sync_platform(source_system: str) -> dict:
    connector = CONNECTORS.get(source_system)
    if connector is None:
        raise ValueError(f"Unknown platform: {source_system}")

    try:
        raw_tickets = await connector.fetch_tickets()
    except Exception as exc:
        logger.warning("Could not fetch tickets from %s: %s", source_system, exc)
        return {"source_system": source_system, "synced": 0, "failed": 0, "total": 0, "error": str(exc)}

    if not settings.dynamodb_configured:
        message = "DynamoDB is not configured — fetched but did not persist"
        logger.info("%s (%d tickets from %s)", message, len(raw_tickets), source_system)
        return {
            "source_system": source_system,
            "synced": 0,
            "failed": 0,
            "total": len(raw_tickets),
            "error": message,
        }

    synced = 0
    failed = 0

    for raw in raw_tickets:
        try:
            record = connector.map_to_internal(raw)
            record.synced_at = datetime.now(timezone.utc).isoformat()
            ticket_repository.upsert(record)
            synced += 1
        except Exception:
            logger.exception("Failed to sync one %s ticket", source_system)
            failed += 1

    return {
        "source_system": source_system,
        "synced": synced,
        "failed": failed,
        "total": len(raw_tickets),
        "error": None,
    }
