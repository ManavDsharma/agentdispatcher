"""Represents tickets native to our own system — created directly through our
API/UI rather than ingested from anywhere. Nothing to poll; writes go straight
to the repository."""

from app.connectors.base import TicketConnector
from app.domain.ticket import TicketRecord


class CustomConnector(TicketConnector):
    source_system = "custom"
    capability = "editable"

    async def fetch_tickets(self) -> list:
        return []

    def map_to_internal(self, raw: dict) -> TicketRecord:
        raise NotImplementedError("custom tickets are created directly, not ingested")
