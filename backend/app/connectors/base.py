"""Platform abstraction so the app isn't tightly coupled to any one ticketing system.

Add a new platform by writing one connector and registering it in registry.py —
nothing else in the app needs to change.
"""

from abc import ABC, abstractmethod
from typing import Literal

from app.domain.ticket import TicketRecord

Capability = Literal["redirect", "editable"]


class TicketConnector(ABC):
    source_system: str
    capability: Capability

    @abstractmethod
    async def fetch_tickets(self) -> list:
        """Pull raw records from the source. Return [] if there's nothing to poll."""

    @abstractmethod
    def map_to_internal(self, raw: dict) -> TicketRecord:
        """Normalize one raw record into our canonical TicketRecord."""

    def push_update(self, ticket_id: str, changes: dict) -> None:
        """Write a change back to the source platform. Extension point — not
        wired up yet; only meaningful for connectors that support bidirectional
        sync, which no connector does today."""
        raise NotImplementedError(f"{self.source_system} connector does not support write-back yet")
