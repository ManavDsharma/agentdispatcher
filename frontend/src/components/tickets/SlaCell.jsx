const URGENCY_COLOR = {
  critical: "text-sla-critical",
  warning: "text-sla-warning",
  safe: "text-sla-safe",
};

export default function SlaCell({ sla }) {
  if (!sla) return <span className="text-text-muted">—</span>;
  return (
    <span className={`font-medium ${URGENCY_COLOR[sla.urgency] ?? "text-text-secondary"}`}>
      {sla.label}
    </span>
  );
}
