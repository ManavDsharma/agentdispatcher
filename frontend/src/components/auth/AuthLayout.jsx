export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-black px-12 py-12 lg:flex">
        <div className="relative flex items-center gap-2.5">
          <img src="/del_logo.png" alt="Deloitte" className="h-16 w-auto object-contain" />
          <span className="text-sm font-semibold tracking-wide text-white">DTP Operate Agent</span>
        </div>

        <div className="relative max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight text-white">
            Agentic support operations,
            <br />
            in one dispatch console.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Live ServiceNow incidents, one-click escalation, and an AI agent
            on call — the ops surface built for L1 support teams.
          </p>
        </div>

        <p className="relative text-xs text-white/40">
          &copy; {new Date().getFullYear()} DTP Operate Agent
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-2 flex items-center gap-2.5 lg:hidden">
            <img src="/del_logo.png" alt="Deloitte" className="h-10 w-auto object-contain" />
            <span className="text-sm font-semibold tracking-wide text-ink">DTP Operate Agent</span>
          </div>

          {eyebrow && (
            <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-secondary">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-ink-secondary">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
