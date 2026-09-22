export default function Topbar({ eyebrow, title, action }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border bg-surface px-8">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
