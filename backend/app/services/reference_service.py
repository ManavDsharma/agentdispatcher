"""Orchestration layer for the categorization-matrix/roster reference data.
The route layer should never talk to DynamoDB directly."""

from app.store import reference_repository


_TRUTHY = {"true", "yes", "y", "1", "active"}
_FALSY = {"false", "no", "n", "0", "inactive"}


def _is_active(item: dict) -> bool:
    value = item.get("active", True)
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    normalized = str(value).strip().lower()
    if normalized in _FALSY:
        return False
    if normalized in _TRUTHY:
        return True
    # Unrecognized representation — default to showing the row rather than
    # silently hiding real reference data over a formatting mismatch.
    return True


async def list_categorization_matrix() -> tuple:
    items, meta = await reference_repository.get_categorization_matrix()
    return [i for i in items if _is_active(i)], meta


async def list_roster() -> tuple:
    items, meta = await reference_repository.get_roster()
    return [i for i in items if _is_active(i)], meta
