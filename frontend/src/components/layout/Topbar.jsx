export function Topbar({
  eyebrow,
  title,
  subtitle,
  action,
}) {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-8 py-3">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
            {eyebrow}
          </p>
        )}

        <h1 className="text-lg font-semibold text-ink">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-0.5 text-xs text-ink-muted">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="ml-4 shrink-0">
          {action}
        </div>
      )}
    </header>
  );
}

export default Topbar;