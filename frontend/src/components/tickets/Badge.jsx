const PRIORITY_TONES = {
  Critical: "text-pill-critical bg-pill-critical-bg",
  High: "text-pill-high bg-pill-high-bg",
  Medium: "text-pill-medium bg-pill-medium-bg",
  Low: "text-pill-low bg-pill-low-bg",
};

const STATUS_TONES = {
  Open: "text-pill-open bg-pill-open-bg",
  "In Progress": "text-pill-progress bg-pill-progress-bg",
  "Pending Approval": "text-pill-pending bg-pill-pending-bg",
  Resolved: "text-pill-resolved bg-pill-resolved-bg",
};

const FALLBACK_TONE = "text-ink-secondary bg-surface-muted";

function Pill({ tone, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return <Pill tone={PRIORITY_TONES[priority] ?? FALLBACK_TONE}>{priority}</Pill>;
}

export function StatusBadge({ status }) {
  return <Pill tone={STATUS_TONES[status] ?? FALLBACK_TONE}>{status}</Pill>;
}
