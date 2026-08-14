"""ServiceNow Table API client — real fetch, isolated from route/mapping logic."""

import httpx

from app.config import settings

INCIDENT_FIELDS = (
    "sys_id,number,short_description,priority,state,category,assigned_to,opened_at"
)

_last_connected = False
_last_checked = False


class ServiceNowError(Exception):
    pass


async def get_incidents(limit: int = 50) -> list:
    """Fetch raw incident records from the ServiceNow Table API."""
    global _last_connected, _last_checked

    if not settings.servicenow_configured:
        raise ServiceNowError("ServiceNow is not configured")

    url = f"{settings.servicenow_instance_url.rstrip('/')}/api/now/table/incident"
    params = {
        "sysparm_limit": limit,
        "sysparm_display_value": "all",
        "sysparm_exclude_reference_link": "true",
        "sysparm_query": "ORDERBYDESCopened_at",
        "sysparm_fields": INCIDENT_FIELDS,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                params=params,
                auth=(settings.servicenow_username, settings.servicenow_password),
            )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        _last_connected = False
        _last_checked = True
        status = exc.response.status_code
        if status in (401, 403):
            raise ServiceNowError("ServiceNow rejected the configured credentials") from exc
        raise ServiceNowError(f"ServiceNow returned HTTP {status}") from exc
    except httpx.RequestError as exc:
        _last_connected = False
        _last_checked = True
        raise ServiceNowError(f"Could not reach ServiceNow: {exc}") from exc

    _last_connected = True
    _last_checked = True
    return response.json().get("result", [])


def get_status() -> dict:
    return {
        "configured": settings.servicenow_configured,
        "connected": _last_connected if _last_checked else False,
    }
