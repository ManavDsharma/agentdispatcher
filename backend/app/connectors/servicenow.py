"""ServiceNow connector: wraps the existing httpx client and owns the raw-incident
mapping that used to live in app/mapping/ticket_mapper.py."""

from datetime import datetime, timezone

from app.config import settings
from app.connectors.base import TicketConnector
from app.domain.ticket import TicketRecord
from app.integrations import servicenow as servicenow_client

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


class ServiceNowConnector(TicketConnector):
    source_system = "servicenow"
    capability = "redirect"

    async def fetch_tickets(self) -> list:
        return await servicenow_client.get_incidents(limit=50)

    def map_to_internal(self, raw: dict) -> TicketRecord:
        sys_id = _field(raw, "sys_id")
        number = _field(raw, "number")
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

        return TicketRecord(
            id=f"servicenow:{sys_id}",
            source_system=self.source_system,
            source_ticket_id=number,
            management_mode="external_redirect",
            external_url=(
                f"{instance_url}/nav_to.do?uri=incident.do?sys_id={sys_id}"
                if instance_url and sys_id
                else None
            ),
            title=_field(raw, "short_description") or "(no description)",
            priority=priority,
            status=status,
            category=category.title() if isinstance(category, str) else category,
            assignee=assignee,
            opened_at=opened_at,
        )
