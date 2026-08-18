const STATE_COLORS = {
  connected: "bg-brand",
  error: "bg-priority-critical",
  mocked: "bg-text-muted",
};

export default function StatusDot({ state = "mocked" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 rounded-full ${STATE_COLORS[state] ?? STATE_COLORS.mocked}`}
    />
  );
}
