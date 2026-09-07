"""Fallback ticket dataset, used when DynamoDB isn't configured/reachable.

Returns TicketRecord domain objects so the repository layer treats mock and
real (DynamoDB) data identically — SLA/created are derived at read time via
TicketRecord.to_api_dict(), not baked in here. Includes a couple of seeded
"custom" tickets so the internal-edit path has something to render even
before any ticket has actually been created through our own UI.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from app.domain.ticket import TicketRecord

# (ticket_id, title, priority, status, category, assignee, minutes_ago)
_SERVICENOW_STYLE_TICKETS = [
    ("INC0012850", "Bot failure — AP Invoice Processor", "Critical", "Open", "Bot Failure", "L. Kumar", 15),
    ("INC0012849", "Schedule not triggering — EOD report", "High", "In Progress", "Schedule", "R. Singh", 105),
    ("INC0012848", "Asset update required — SAP credential", "High", "Pending Approval", "Asset", "L. Kumar", 150),
    ("INC0012847", "New robot deployment request", "Medium", "Open", "Deployment", "Unassigned", 120),
    ("INC0012846", "Access request — Orchestrator", "Medium", "Resolved", "Access", "P. Verma", 480),
    ("INC0012845", "Bot performance degradation — CRM sync", "Medium", "In Progress", "Performance", "R. Singh", 180),
    ("INC0012844", "Login failure — Orchestrator portal", "Critical", "Open", "Access", "Unassigned", 20),
    ("INC0012843", "Schedule overlap — Month-end close", "Low", "Pending Approval", "Schedule", "S. Rao", 300),
    ("INC0012842", "Asset password expiring — Salesforce", "Low", "Open", "Asset", "S. Rao", 600),
    ("INC0012841", "Deployment rollback needed — Invoice bot v2", "High", "In Progress", "Deployment", "L. Kumar", 60),
    ("INC0012840", "Bot failure — Vendor reconciliation job", "High", "Resolved", "Bot Failure", "P. Verma", 1440),
    ("INC0012839", "Performance degradation — Queue processing delayed", "Medium", "Open", "Performance", "Unassigned", 240),
    ("INC0012838", "Access revoked — Terminated contractor", "Low", "Resolved", "Access", "R. Singh", 2880),
]

# (id, title, priority, status, category, assignee, work_notes, minutes_ago)
_CUSTOM_TICKETS = [
    (
        "custom-0001",
        "VPN access request — new hire onboarding",
        "Medium",
        "Open",
        "Access",
        "Unassigned",
        "",
        45,
    ),
    (
        "custom-0002",
        "Print server offline — 4th floor",
        "Low",
        "In Progress",
        "Asset",
        "R. Singh",
        "Vendor ticket opened, awaiting replacement part.",
        200,
    ),
]


def get_mock_tickets() -> list:
    now = datetime.now(timezone.utc)
    tickets = []

    for ticket_id, title, priority, status, category, assignee, minutes_ago in _SERVICENOW_STYLE_TICKETS:
        tickets.append(
            TicketRecord(
                id=f"servicenow:{ticket_id}",
                source_system="servicenow",
                source_ticket_id=ticket_id,
                management_mode="external_redirect",
                external_url=None,
                title=title,
                priority=priority,
                status=status,
                category=category,
                assignee=assignee,
                opened_at=now - timedelta(minutes=minutes_ago),
            )
        )

    for ticket_id, title, priority, status, category, assignee, work_notes, minutes_ago in _CUSTOM_TICKETS:
        tickets.append(
            TicketRecord(
                id=ticket_id,
                source_system="custom",
                source_ticket_id=None,
                management_mode="internal_edit",
                external_url=None,
                title=title,
                priority=priority,
                status=status,
                category=category,
                assignee=assignee,
                opened_at=now - timedelta(minutes=minutes_ago),
                work_notes=work_notes,
            )
        )

    return tickets


def get_mock_ticket(ticket_id: str) -> Optional[TicketRecord]:
    return next((t for t in get_mock_tickets() if t.id == ticket_id), None)
