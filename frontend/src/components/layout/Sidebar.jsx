import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Ticket, FilePlus } from "lucide-react";
import StatusDot from "./StatusDot";
import { fetchHealth } from "../../services/healthService";

const NAV_ITEMS = [
  { label: "Tickets", to: "/", icon: Ticket, end: true },
  { label: "Create Issue", to: "/issues/new", icon: FilePlus },
];

const POLL_INTERVAL_MS = 30000;

export default function Sidebar() {
  const [serviceNowState, setServiceNowState] = useState("mocked");

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      fetchHealth()
        .then((data) => {
          if (cancelled) return;
          const { configured, connected } = data.servicenow;
          setServiceNowState(
            !configured ? "mocked" : connected ? "connected" : "error",
          );
        })
        .catch(() => {
          if (!cancelled) setServiceNowState("error");
        });
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const systemStatus = [
    { label: "ServiceNow", state: serviceNowState },
    { label: "AI Agent", state: "connected" },
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar-bg">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <img
          src="/del_logo.png"
          alt="Deloitte"
          className="h-6 w-auto object-contain"
        />
        <span className="text-sm font-semibold tracking-wide text-text-primary">
          L1 Dispatcher
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-widest text-text-muted">
          Navigation
        </p>
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-brand text-white font-medium"
                  : "text-text-secondary hover:bg-brand-soft hover:text-brand"
              }`
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-4 border-t border-sidebar-border px-4 py-4">
        <div>
          <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-widest text-text-muted">
            System Status
          </p>
          <ul className="space-y-1.5">
            {systemStatus.map(({ label, state }) => (
              <li
                key={label}
                className="flex items-center justify-between px-1 text-xs text-text-secondary"
              >
                <span>{label}</span>
                <StatusDot state={state} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3 rounded-md px-1 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
            DU
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              Demo User
            </p>
            <p className="truncate text-xs text-text-muted">L1 Support</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
