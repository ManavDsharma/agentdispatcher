"""Fallback issue dataset, used when ServiceNow isn't configured/reachable.

Already in our mapped issue shape (not raw ServiceNow records) since this
path bypasses ServiceNow entirely. SLA/created are computed relative to "now"
on every call so the fallback still feels live across a long-running process.
"""

from datetime import datetime, timedelta, timezone

from app.mapping.sla import compute_sla

# (issue_id, title, priority, status, category, assignee, minutes_ago)
_ISSUES = [
    ("IPT0020501", "Access review not performed for terminated contractor", "Critical", "New", "Control does not exist", "L. Kumar", 15),
    ("IPT0020499", "Vendor SOC 2 report not obtained before renewal", "High", "Analyze", "Non-compliance to a policy", "R. Singh", 105),
    ("IPT0020497", "Segregation of duties gap — Finance approval workflow", "High", "Respond", "Control design effectiveness failure", "L. Kumar", 150),
    ("IPT0020495", "Data retention policy not applied to archived records", "Moderate", "New", "Non-compliance to a regulation", "Unassigned", 120),
    ("IPT0020490", "Quarterly access recertification completed late", "Moderate", "Closed Complete", "Control operative effectiveness failure", "P. Verma", 480),
    ("IPT0020488", "Encryption at rest not enforced on backup storage", "High", "Analyze", "Control does not meet requirement", "R. Singh", 180),
    ("IPT0020486", "Privileged account activity not logged", "Critical", "New", "Control does not exist", "Unassigned", 20),
    ("IPT0020483", "Business continuity test overdue for critical vendor", "Low", "Review", "Operational resilience", "S. Rao", 300),
    ("IPT0020481", "Recommended MFA rollout for third-party portal", "Low", "New", "Recommendation for a new policy", "S. Rao", 600),
    ("IPT0020478", "Audit evidence request pending from process owner", "High", "Respond", "Documentation", "L. Kumar", 60),
    ("IPT0020474", "Prior year audit finding remediation verified", "High", "Closed Complete", "Control design effectiveness failure", "P. Verma", 1440),
    ("IPT0020470", "Change management approvals missing for two releases", "Moderate", "New", "Non-compliance to a policy", "Unassigned", 240),
    ("IPT0020465", "Contractor offboarding checklist gap closed", "Low", "Closed Incomplete", "Process optimization or improvement", "R. Singh", 2880),
]


def get_mock_issues() -> list:
    now = datetime.now(timezone.utc)
    issues = []
    for issue_id, title, priority, status, category, assignee, minutes_ago in _ISSUES:
        opened_at = now - timedelta(minutes=minutes_ago)
        is_closed = status.startswith("Closed")
        sla = {"label": "—", "urgency": "safe"} if is_closed else compute_sla(priority, opened_at)
        issues.append(
            {
                "issue_id": issue_id,
                "title": title,
                "priority": priority,
                "status": status,
                "category": category,
                "assignee": assignee,
                "sla": sla,
                "created": opened_at.strftime("%b %d, %I:%M %p"),
                "issue_url": None,
            }
        )
    return issues
