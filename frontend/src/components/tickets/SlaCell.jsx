const URGENCY_COLOR = {
  critical: "text-urgency-critical",
  warning: "text-urgency-warning",
  safe: "text-urgency-safe",
};

export default function SlaCell({ sla }) {
  if (!sla) return <span className="text-ink-muted">—</span>;
  return (
    <span className={`font-medium ${URGENCY_COLOR[sla.urgency] ?? "text-ink-secondary"}`}>
      {sla.label}
    </span>
  );
}
