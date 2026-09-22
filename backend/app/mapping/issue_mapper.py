"""Maps raw sn_grc_issue records (sysparm_display_value=all shape) to our issue shape.

Choice lists below were reverse-engineered against the live instance (sys_choice +
the actual Compliance Workspace Create Issue form state) — see
docs/GRC_ISSUE_INTEGRATION.md for how these were confirmed.
"""

from datetime import datetime, timezone

from app.config import settings
from app.mapping.sla import compute_sla

PRIORITY_CHOICES = [
    {"value": "1", "label": "1 - Critical"},
    {"value": "2", "label": "2 - High"},
    {"value": "3", "label": "3 - Moderate"},
    {"value": "4", "label": "4 - Low"},
    {"value": "5", "label": "5 - Planning"},
]
PRIORITY_MAP = {c["value"]: c["label"].split(" - ")[1] for c in PRIORITY_CHOICES}

CLASSIFICATION_CHOICES = [
    {"value": "1", "label": "Compliance"},
    {"value": "2", "label": "Risk"},
    {"value": "3", "label": "Audit"},
    {"value": "4", "label": "Vendor Risk"},
    {"value": "20", "label": "Operational resilience"},
]
CLASSIFICATION_MAP = {c["value"]: c["label"] for c in CLASSIFICATION_CHOICES}

# Rendered as "Observation Category" in Compliance Workspace — backed by issue_type.
ISSUE_TYPE_CHOICES = [
    {"value": "7", "label": "Control design effectiveness failure"},
    {"value": "8", "label": "Control operative effectiveness failure"},
    {"value": "11", "label": "Control does not meet requirement"},
    {"value": "9", "label": "Control does not exist"},
    {"value": "2", "label": "Non-compliance to a regulation"},
    {"value": "3", "label": "Non-compliance to a policy"},
    {"value": "4", "label": "Improvement or suggestion to an existing policy"},
    {"value": "5", "label": "Recommendation for a new policy"},
    {"value": "6", "label": "Process optimization or improvement"},
    {"value": "12", "label": "Observation"},
    {"value": "13", "label": "Data Breach"},
    {"value": "15", "label": "Fraud"},
    {"value": "16", "label": "Misstatement"},
    {"value": "17", "label": "Training"},
    {"value": "14", "label": "Documentation"},
    {"value": "1", "label": "Risk issue"},
    {"value": "20", "label": "Scalability and automation"},
    {"value": "10", "label": "Other"},
]
ISSUE_TYPE_MAP = {c["value"]: c["label"] for c in ISSUE_TYPE_CHOICES}

STATE_MAP = {
    "1": "New",
    "2": "Analyze",
    "5": "Respond",
    "0": "Review",
    "3": "Closed Complete",
    "4": "Closed Incomplete",
}


def _field(record: dict, name: str, key: str = "value"):
    value = record.get(name)
    if isinstance(value, dict):
        return value.get(key)
    return value


def map_issue(raw: dict) -> dict:
    sys_id = _field(raw, "sys_id")
    priority_code = str(_field(raw, "priority") or "")
    state_code = str(_field(raw, "state") or "")
    issue_type_code = str(_field(raw, "issue_type") or "")
    assignee = _field(raw, "assigned_to", "display_value") or "Unassigned"
    opened_raw = _field(raw, "opened_at")

    priority = PRIORITY_MAP.get(priority_code, "Low")
    status = STATE_MAP.get(state_code, "New")
    category = ISSUE_TYPE_MAP.get(issue_type_code, "Uncategorized")

    try:
        opened_at = datetime.strptime(opened_raw, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        opened_at = datetime.now(timezone.utc)

    instance_url = (settings.servicenow_instance_url or "").rstrip("/")
    is_closed = status.startswith("Closed")

    return {
        "issue_id": _field(raw, "number"),
        "title": _field(raw, "short_description") or "(no description)",
        "priority": priority,
        "status": status,
        "category": category,
        "assignee": assignee,
        "sla": {"label": "—", "urgency": "safe"} if is_closed else compute_sla(priority, opened_at),
        "created": opened_at.strftime("%b %d, %I:%M %p"),
        "issue_url": (
            f"{instance_url}/nav_to.do?uri=sn_grc_issue.do?sys_id={sys_id}"
            if instance_url and sys_id
            else None
        ),
    }


def build_create_payload(data: dict) -> dict:
    """Maps our Create Issue form shape straight to ServiceNow field names.
    Only user-provided fields are included — number/sys_id/state/opened_at/
    opened_by/due_date are all populated by ServiceNow itself."""
    payload = {"short_description": data["short_description"]}
    for frontend_key, sn_key in (
        ("description", "description"),
        ("classification", "classification"),
        ("priority", "priority"),
        ("issue_type", "issue_type"),
        ("issue_rating", "issue_rating"),
    ):
        value = data.get(frontend_key)
        if value:
            payload[sn_key] = value
    return payload
