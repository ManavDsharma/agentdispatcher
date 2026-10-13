export default function SlaCell({ value, breached }) {
  if (!value) return <span className="text-ink-muted">—</span>;
  return (
    <span className={`font-medium ${breached ? "text-urgency-critical" : "text-urgency-safe"}`}>
      {value}
    </span>
  );
}
