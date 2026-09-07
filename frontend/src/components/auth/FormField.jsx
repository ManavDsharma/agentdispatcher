export default function FormField({ label, error, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
        {label}
      </span>
      <input
        {...inputProps}
        className={`w-full rounded-md border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors focus:border-brand ${
          error ? "border-pill-critical" : "border-surface-border"
        }`}
      />
      {error && <span className="mt-1.5 block text-xs text-pill-critical">{error}</span>}
    </label>
  );
}
