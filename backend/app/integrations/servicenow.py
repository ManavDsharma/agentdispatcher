"""ServiceNow Table API client for sn_grc_issue (Compliance Workspace Issues) — real fetch/create, isolated from route/mapping logic."""

import httpx

from app.config import settings

ISSUE_FIELDS = (
    "sys_id,number,short_description,description,priority,state,issue_type,"
    "classification,assigned_to,opened_at,issue_rating"
)

_last_connected = False
_last_checked = False


class ServiceNowError(Exception):
    pass


def _issue_table_url() -> str:
    return f"{settings.servicenow_instance_url.rstrip('/')}/api/now/table/sn_grc_issue"


async def get_issues(limit: int = 50) -> list:
    """Fetch raw sn_grc_issue records from the ServiceNow Table API."""
    global _last_connected, _last_checked

    if not settings.servicenow_configured:
        raise ServiceNowError("ServiceNow is not configured")

    params = {
        "sysparm_limit": limit,
        "sysparm_display_value": "all",
        "sysparm_exclude_reference_link": "true",
        "sysparm_query": "ORDERBYDESCopened_at",
        "sysparm_fields": ISSUE_FIELDS,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                _issue_table_url(),
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


async def create_issue(payload: dict) -> dict:
    """Create a new sn_grc_issue record. payload keys are already the raw ServiceNow
    field names (short_description, description, classification, priority, issue_type,
    issue_rating) — see app/mapping/issue_mapper.py for the frontend->ServiceNow mapping.
    """
    if not settings.servicenow_configured:
        raise ServiceNowError("ServiceNow is not configured")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                _issue_table_url(),
                json=payload,
                auth=(settings.servicenow_username, settings.servicenow_password),
            )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403):
            raise ServiceNowError("ServiceNow rejected the configured credentials") from exc
        raise ServiceNowError(f"ServiceNow returned HTTP {status}") from exc
    except httpx.RequestError as exc:
        raise ServiceNowError(f"Could not reach ServiceNow: {exc}") from exc

    return response.json().get("result", {})


async def get_issue_ratings() -> list:
    """Live-fetch Issue Rating options from sn_grc_issue_rating.

    This is a reference field, not a static choice list — an admin can add/rename
    ratings in ServiceNow at any time, so these values must never be hardcoded
    in the frontend.
    """
    if not settings.servicenow_configured:
        raise ServiceNowError("ServiceNow is not configured")

    url = f"{settings.servicenow_instance_url.rstrip('/')}/api/now/table/sn_grc_issue_rating"
    params = {
        "sysparm_query": "active=true^ORDERBYremediation_timeframe",
        "sysparm_fields": "sys_id,issue_rating,remediation_timeframe",
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
        status = exc.response.status_code
        if status in (401, 403):
            raise ServiceNowError("ServiceNow rejected the configured credentials") from exc
        raise ServiceNowError(f"ServiceNow returned HTTP {status}") from exc
    except httpx.RequestError as exc:
        raise ServiceNowError(f"Could not reach ServiceNow: {exc}") from exc

    return [
        {"value": r["sys_id"], "label": r["issue_rating"]}
        for r in response.json().get("result", [])
    ]


def get_status() -> dict:
    return {
        "configured": settings.servicenow_configured,
        "connected": _last_connected if _last_checked else False,
    }
