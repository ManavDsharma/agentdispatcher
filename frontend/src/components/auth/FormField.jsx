export default function FormField({ label, error, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-secondary">
        {label}
      </span>
      <input
        {...inputProps}
        className={`w-full rounded-md border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent ${
          error ? "border-priority-critical" : "border-border"
        }`}
      />
      {error && <span className="mt-1.5 block text-xs text-priority-critical">{error}</span>}
    </label>
  );
}
