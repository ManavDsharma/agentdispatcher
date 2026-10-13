"""Read-only access to the categorization-matrix and roster reference tables
backing the ticket edit form's cascading dropdowns. Same fallback philosophy
as ticket_repository: fall back to mock reference data if the table isn't
configured, or a real call fails.
"""

import logging

from app.config import settings
from app.dynamo_utils import json_safe_item
from app.mock_reference_data import get_mock_categorization_matrix, get_mock_roster
from app.store.dynamo import get_table

logger = logging.getLogger(__name__)


async def get_categorization_matrix() -> tuple:
    if not settings.categorization_matrix_configured:
        return get_mock_categorization_matrix(), {"source": "mock", "reason": "not_configured", "error": None}

    try:
        response = get_table(settings.categorization_matrix_table_name).scan()
        items = [json_safe_item(item) for item in response.get("Items", [])]
        return items, {"source": "dynamodb", "reason": None, "error": None}
    except Exception as exc:
        logger.warning("Categorization matrix scan failed, falling back to mock: %s", exc)
        return get_mock_categorization_matrix(), {"source": "mock", "reason": "connection_error", "error": str(exc)}


async def get_roster() -> tuple:
    if not settings.roster_configured:
        return get_mock_roster(), {"source": "mock", "reason": "not_configured", "error": None}

    try:
        response = get_table(settings.roster_table_name).scan()
        items = [json_safe_item(item) for item in response.get("Items", [])]
        return items, {"source": "dynamodb", "reason": None, "error": None}
    except Exception as exc:
        logger.warning("Roster scan failed, falling back to mock: %s", exc)
        return get_mock_roster(), {"source": "mock", "reason": "connection_error", "error": str(exc)}
