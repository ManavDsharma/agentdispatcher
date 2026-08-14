const PRIORITY_TONES = {
  Critical: "text-priority-critical bg-priority-critical-bg",
  High: "text-priority-high bg-priority-high-bg",
  Medium: "text-priority-medium bg-priority-medium-bg",
  Low: "text-priority-low bg-priority-low-bg",
};

const STATUS_TONES = {
  Open: "text-status-open bg-status-open-bg",
  "In Progress": "text-status-progress bg-status-progress-bg",
  "Pending Approval": "text-status-pending bg-status-pending-bg",
  Resolved: "text-status-resolved bg-status-resolved-bg",
};

const FALLBACK_TONE = "text-text-secondary bg-bg-surface-hover";

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
