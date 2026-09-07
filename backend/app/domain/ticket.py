"""Canonical ticket schema shared by every connector, the repository, and the API.

SLA and the display timestamp are deliberately NOT stored — they're derived
from `priority` + `opened_at` at read time (see to_api_dict) so they can't go
stale between sync cycles.
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

from app.mapping.sla import compute_sla

ManagementMode = Literal["external_redirect", "internal_edit"]


class TicketRecord(BaseModel):
    id: str
    source_system: str
    source_ticket_id: Optional[str] = None
    management_mode: ManagementMode
    external_url: Optional[str] = None

    title: str
    priority: str
    status: str
    category: str
    assignee: str
    opened_at: datetime
    work_notes: str = ""

    source_updated_at: Optional[str] = None
    synced_at: Optional[str] = None
    updated_at: Optional[str] = None

    def to_api_dict(self) -> dict:
        sla = {"label": "—", "urgency": "safe"} if self.status == "Resolved" else compute_sla(
            self.priority, self.opened_at
        )
        return {
            "id": self.id,
            "ticket_id": self.source_ticket_id or self.id,
            "source_system": self.source_system,
            "management_mode": self.management_mode,
            "external_url": self.external_url,
            "title": self.title,
            "priority": self.priority,
            "status": self.status,
            "category": self.category,
            "assignee": self.assignee,
            "sla": sla,
            "created": self.opened_at.strftime("%b %d, %I:%M %p"),
            "work_notes": self.work_notes,
        }

    def to_item(self) -> dict:
        """JSON-safe dict for DynamoDB (datetimes become ISO strings)."""
        return self.model_dump(mode="json")

    @classmethod
    def from_item(cls, item: dict) -> "TicketRecord":
        return cls(**item)
