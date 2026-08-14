"""Fallback ticket dataset, used when ServiceNow isn't configured/reachable.

Already in our mapped ticket shape (not raw ServiceNow records) since this
path bypasses ServiceNow entirely. SLA/created are computed relative to "now"
on every call so the fallback still feels live across a long-running process.
"""

from datetime import datetime, timedelta, timezone

from app.mapping.sla import compute_sla

# (ticket_id, title, priority, status, category, assignee, minutes_ago)
_TICKETS = [
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


def get_mock_tickets() -> list:
    now = datetime.now(timezone.utc)
    tickets = []
    for ticket_id, title, priority, status, category, assignee, minutes_ago in _TICKETS:
        opened_at = now - timedelta(minutes=minutes_ago)
        sla = {"label": "—", "urgency": "safe"} if status == "Resolved" else compute_sla(priority, opened_at)
        tickets.append(
            {
                "ticket_id": ticket_id,
                "title": title,
                "priority": priority,
                "status": status,
                "category": category,
                "assignee": assignee,
                "sla": sla,
                "created": opened_at.strftime("%b %d, %I:%M %p"),
                "incident_url": None,
            }
        )
    return tickets
