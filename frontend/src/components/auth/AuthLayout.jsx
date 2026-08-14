export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-bg-surface px-12 py-12 lg:flex">
        <div
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent 70%)" }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-white">
            L1
          </div>
          <span className="text-sm font-semibold tracking-wide text-text-primary">
            L1 Dispatcher
          </span>
        </div>

        <div className="relative max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight text-text-primary">
            Agentic support operations,
            <br />
            in one dispatch console.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Live ServiceNow incidents, one-click escalation, and an AI agent
            on call — the ops surface built for L1 support teams.
          </p>
        </div>

        <p className="relative text-xs text-text-muted">
          &copy; {new Date().getFullYear()} L1 Dispatcher
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-2 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
              L1
            </div>
            <span className="text-sm font-semibold tracking-wide text-text-primary">
              L1 Dispatcher
            </span>
          </div>

          {eyebrow && (
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-text-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-text-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
