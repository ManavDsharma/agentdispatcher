"""Canonical ticket schema — mirrors the real DynamoDB table directly.

DynamoDB is the sole source of truth now; nothing in this backend ingests or
syncs tickets from anywhere. We only read what's there and, for tickets not
owned by a recognized external platform (see VALID_REDIRECT_SOURCE_SYSTEMS),
write back a small set of editable fields instead.

Fields whose real type/format we don't control (durations, SLA deadlines,
timestamps) are kept as plain strings rather than parsed/typed, so ingestion
we don't own can't fail our validation — we display whatever is there.
"""

from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

# Fields an L2 engineer can actually change on an internally-managed ticket.
# Deliberately excludes: ticket_id (primary key), created_at/updated_at/
# closed_at (backend-owned timestamps), source_system/url (hidden from the
# edit form entirely — they drive management_mode, not user-editable),
# priority (derived from impact+urgency by compute_priority, never set
# directly — see ticket_service.update_ticket), and the SLA/duration/breach
# fields (display-only, not something an L2 edit should be able to fake).
EDITABLE_FIELDS = {
    "short_description",
    "description",
    "category",
    "sub_category",
    "urgency",
    "impact",
    "state",
    "assigned_to",
    "opened_by",
    "opened_for",
    "team_id",
    "working_notes",
}

# source_system values that get the "redirect to the external platform"
# treatment. Anything not in this list opens the in-app editable form
# instead, regardless of whether it happens to carry a url. Matched
# case-insensitively. Extend this set as more platforms are recognized.
VALID_REDIRECT_SOURCE_SYSTEMS = {"servicenow", "servicenow portal"}


def _as_str(value) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return str(int(value)) if value == value.to_integral_value() else str(value)
    return str(value)


class TicketRecord(BaseModel):
    ticket_id: str
    source_system: str = ""
    url: Optional[str] = None

    short_description: str = ""
    description: str = ""
    category: str = ""
    sub_category: str = ""
    priority: str = ""
    urgency: str = ""
    impact: str = ""
    state: str = ""

    assigned_to: str = "Unassigned"
    opened_by: str = ""
    opened_for: str = ""
    team_id: str = ""
    working_notes: str = ""

    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    closed_at: Optional[str] = None

    assignment_duration: Optional[str] = None
    assignment_sla: Optional[str] = None
    resolution_duration: Optional[str] = None
    resolution_sla: Optional[str] = None
    has_assignment_sla_breach: bool = False
    has_resolution_sla_breach: bool = False

    @property
    def management_mode(self) -> str:
        is_recognized = self.source_system.strip().lower() in VALID_REDIRECT_SOURCE_SYSTEMS
        return "external_redirect" if is_recognized else "internal_edit"

    def to_api_dict(self) -> dict:
        data = self.model_dump()
        data["management_mode"] = self.management_mode
        return data

    @classmethod
    def from_item(cls, item: dict) -> "TicketRecord":
        """Builds a record from a raw DynamoDB (or mock) item, coercing
        whatever loosely-typed values ingestion produced (e.g. Decimal) into
        strings rather than rejecting the item outright."""
        loose_fields = (
            "created_at",
            "updated_at",
            "closed_at",
            "assignment_duration",
            "assignment_sla",
            "resolution_duration",
            "resolution_sla",
        )
        normalized = dict(item)
        for field in loose_fields:
            if field in normalized:
                normalized[field] = _as_str(normalized[field])
        return cls(**normalized)
