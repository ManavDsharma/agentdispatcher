const PRIORITY_TONES = {
  critical: "text-pill-critical bg-pill-critical-bg",
  high: "text-pill-high bg-pill-high-bg",
  medium: "text-pill-medium bg-pill-medium-bg",
  low: "text-pill-low bg-pill-low-bg",
};

const STATUS_TONES = {
  open: "text-pill-open bg-pill-open-bg",
  new: "text-pill-open bg-pill-open-bg",
  "in progress": "text-pill-progress bg-pill-progress-bg",
  pending: "text-pill-pending bg-pill-pending-bg",
  "pending approval": "text-pill-pending bg-pill-pending-bg",
  "on hold": "text-pill-pending bg-pill-pending-bg",
  resolved: "text-pill-resolved bg-pill-resolved-bg",
  closed: "text-pill-resolved bg-pill-resolved-bg",
};

const FALLBACK_TONE = "text-ink-secondary bg-surface-muted";

// DB values come from an ingestion process we don't control, so match
// case/whitespace-insensitively rather than assuming a fixed casing.
function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

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
  return <Pill tone={PRIORITY_TONES[normalize(priority)] ?? FALLBACK_TONE}>{priority || "—"}</Pill>;
}

export function StatusBadge({ status }) {
  return <Pill tone={STATUS_TONES[normalize(status)] ?? FALLBACK_TONE}>{status || "—"}</Pill>;
}
