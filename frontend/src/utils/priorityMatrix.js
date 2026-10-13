// Mirrors backend/app/domain/priority_matrix.py — for an instant preview in
// the edit form only. The backend recomputes and persists the authoritative
// value on save; this is never sent to the API directly.
const MATRIX = {
  "High|High": "1 - Critical",
  "High|Medium": "2 - High",
  "High|Low": "3 - Moderate",
  "Medium|High": "2 - High",
  "Medium|Medium": "3 - Moderate",
  "Medium|Low": "4 - Low",
  "Low|High": "3 - Moderate",
  "Low|Medium": "4 - Low",
  "Low|Low": "5 - Planning",
};

export function computePriority(impact, urgency) {
  if (!impact || !urgency) return "";
  return MATRIX[`${impact}|${urgency}`] ?? "";
}
