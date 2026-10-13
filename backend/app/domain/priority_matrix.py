"""Standard ServiceNow default Priority matrix: Impact x Urgency -> Priority.

Computed server-side (never trust a client-supplied priority) so the stored
value can't drift from what Impact/Urgency actually say. The frontend mirrors
this table for an instant preview before saving, but this is authoritative.
"""

_MATRIX = {
    ("High", "High"): "1 - Critical",
    ("High", "Medium"): "2 - High",
    ("High", "Low"): "3 - Moderate",
    ("Medium", "High"): "2 - High",
    ("Medium", "Medium"): "3 - Moderate",
    ("Medium", "Low"): "4 - Low",
    ("Low", "High"): "3 - Moderate",
    ("Low", "Medium"): "4 - Low",
    ("Low", "Low"): "5 - Planning",
}


def compute_priority(impact: str, urgency: str) -> str:
    key = ((impact or "").strip().title(), (urgency or "").strip().title())
    return _MATRIX.get(key, "")
