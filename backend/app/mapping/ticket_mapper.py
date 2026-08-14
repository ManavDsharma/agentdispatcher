"""Maps raw ServiceNow incident records (sysparm_display_value=all shape) to our ticket shape."""

from datetime import datetime, timezone

from app.config import settings
from app.mapping.sla import compute_sla

PRIORITY_MAP = {
    "1": "Critical",
    "2": "High",
    "3": "Medium",
    "4": "Low",
    "5": "Low",
}

# ServiceNow incident.state OOB values. There's no native "Pending Approval"
# state on the incident table — "On Hold" (3) is mapped to it as the closest
# ops-relevant equivalent, per CLAUDE.md's status mapping decision.
STATE_MAP = {
    "1": "Open",
    "2": "In Progress",
    "3": "Pending Approval",
    "6": "Resolved",
    "7": "Resolved",
    "8": "Resolved",
}


def _field(record: dict, name: str, key: str = "value"):
    value = record.get(name)
    if isinstance(value, dict):
        return value.get(key)
    return value


def map_incident(raw: dict) -> dict:
    sys_id = _field(raw, "sys_id")
    priority_code = _field(raw, "priority")
    state_code = _field(raw, "state")
    category = _field(raw, "category", "display_value") or _field(raw, "category") or "Uncategorized"
    assignee = _field(raw, "assigned_to", "display_value") or "Unassigned"
    opened_raw = _field(raw, "opened_at")

    priority = PRIORITY_MAP.get(str(priority_code), "Low")
    status = STATE_MAP.get(str(state_code), "Open")

    try:
        opened_at = datetime.strptime(opened_raw, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        opened_at = datetime.now(timezone.utc)

    instance_url = (settings.servicenow_instance_url or "").rstrip("/")

    return {
        "ticket_id": _field(raw, "number"),
        "title": _field(raw, "short_description") or "(no description)",
        "priority": priority,
        "status": status,
        "category": category.title() if isinstance(category, str) else category,
        "assignee": assignee,
        "sla": {"label": "—", "urgency": "safe"} if status == "Resolved" else compute_sla(priority, opened_at),
        "created": opened_at.strftime("%b %d, %I:%M %p"),
        "incident_url": f"{instance_url}/nav_to.do?uri=incident.do?sys_id={sys_id}" if instance_url and sys_id else None,
    }
