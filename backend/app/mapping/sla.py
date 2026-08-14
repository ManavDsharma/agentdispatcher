"""
Placeholder SLA countdown, derived from priority + opened time.

Real ServiceNow SLA tracking lives in the separate `task_sla` table, which is
out of scope for a plain `incident` Table API pull this phase (see CLAUDE.md).
This heuristic gives every ticket a plausible, live-updating SLA figure so the
column isn't blank, using a fixed response-time window per priority.
"""

from datetime import datetime, timezone

WINDOW_HOURS = {
    "Critical": 1,
    "High": 4,
    "Medium": 8,
    "Low": 24,
}


def compute_sla(priority: str, opened_at: datetime) -> dict:
    if opened_at.tzinfo is None:
        opened_at = opened_at.replace(tzinfo=timezone.utc)

    window_hours = WINDOW_HOURS.get(priority, WINDOW_HOURS["Low"])
    elapsed = datetime.now(timezone.utc) - opened_at
    remaining = window_hours * 3600 - elapsed.total_seconds()

    if remaining <= 0:
        return {"label": "Overdue", "urgency": "critical"}

    hours, remainder = divmod(int(remaining), 3600)
    minutes = remainder // 60
    label = f"{hours}:{minutes:02d}"

    if remaining < 3600:
        urgency = "critical"
    elif remaining < 2 * 3600:
        urgency = "warning"
    else:
        urgency = "safe"

    return {"label": label, "urgency": urgency}
