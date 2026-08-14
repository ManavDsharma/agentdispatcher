import { useEffect, useMemo, useState } from "react";
import { Search, Plus, AlertTriangle, Info } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { PriorityBadge, StatusBadge } from "../components/tickets/Badge";
import SlaCell from "../components/tickets/SlaCell";
import RowActionsMenu from "../components/tickets/RowActionsMenu";
import ToastStack from "../components/tickets/ToastStack";
import { fetchTickets } from "../services/ticketsService";

const STATUS_TABS = ["All", "Open", "In Progress", "Pending Approval", "Resolved"];
const PRIORITIES = ["All Priorities", "Critical", "High", "Medium", "Low"];

let toastId = 0;

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ source: null, reason: null, error: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [statusTab, setStatusTab] = useState("All");
  const [priority, setPriority] = useState("All Priorities");
  const [search, setSearch] = useState("");

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchTickets()
      .then((data) => {
        if (cancelled) return;
        setTickets(data.tickets);
        setMeta({ source: data.source, reason: data.reason, error: data.error });
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabCounts = useMemo(() => {
    const counts = { All: tickets.length };
    for (const t of tickets) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return counts;
  }, [tickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusTab !== "All" && t.status !== statusTab) return false;
      if (priority !== "All Priorities" && t.priority !== priority) return false;
      if (q && !`${t.ticket_id} ${t.title} ${t.assignee}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tickets, statusTab, priority, search]);

  const pushToast = (message) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  const handleReminder = (ticket) => {
    console.log("Send reminder email", { ticketId: ticket.ticket_id, assignee: ticket.assignee });
    pushToast(
      `Reminder email queued for ${ticket.assignee === "Unassigned" ? ticket.ticket_id : ticket.assignee}.`,
    );
  };

  const handleEscalate = (ticket) => {
    if (!window.confirm(`Escalate ${ticket.ticket_id}? This will notify the on-call lead.`)) return;
    console.log("Escalate", { ticketId: ticket.ticket_id, priority: ticket.priority });
    pushToast(`${ticket.ticket_id} escalated.`);
  };

  return (
    <>
      <Topbar
        eyebrow="Support Ops"
        title="Tickets"
        action={
          <button
            disabled
            title="Coming soon"
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            <Plus size={16} strokeWidth={2} />
            New Ticket
          </button>
        }
      />

      <main className="flex-1 overflow-auto p-8">
        {meta.reason === "connection_error" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-priority-critical-bg bg-priority-critical-bg px-4 py-3 text-sm text-priority-critical">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
            <span>Couldn&apos;t reach ServiceNow ({meta.error}). Showing mock data instead.</span>
          </div>
        )}
        {meta.reason === "not_configured" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-border bg-bg-surface px-4 py-3 text-sm text-text-secondary">
            <Info size={16} className="mt-0.5 shrink-0 text-text-muted" strokeWidth={1.75} />
            <span>
              ServiceNow isn&apos;t configured yet — showing mock data. Add credentials to
              backend/.env to connect.
            </span>
          </div>
        )}
        {loadError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-priority-critical-bg bg-priority-critical-bg px-4 py-3 text-sm text-priority-critical">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
            <span>Couldn&apos;t reach the backend ({loadError}).</span>
          </div>
        )}

        <div className="mb-4 flex items-center gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                statusTab === tab
                  ? "bg-accent-soft text-text-primary"
                  : "text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary"
              }`}
            >
              {tab} <span className="text-text-muted">{tabCounts[tab] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              strokeWidth={1.75}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, assignee..."
              className="w-full rounded-md border border-border bg-bg-surface py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
            />
          </div>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-border bg-bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-surface text-left text-[11px] uppercase tracking-widest text-text-muted">
                <th className="px-4 py-3 font-medium">Ticket ID</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
                <th className="px-4 py-3 font-medium">SLA</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-3.5 w-full animate-pulse rounded bg-bg-surface-hover" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-text-muted">
                    No tickets match your filters.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((t) => (
                  <tr
                    key={t.ticket_id}
                    className="border-b border-border last:border-0 hover:bg-bg-surface/60"
                  >
                    <td className="px-4 py-3.5 font-medium">
                      {t.incident_url ? (
                        <a
                          href={t.incident_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline"
                        >
                          {t.ticket_id}
                        </a>
                      ) : (
                        <span className="text-text-secondary" title="Mock data — no ServiceNow link">
                          {t.ticket_id}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3.5 text-text-primary" title={t.title}>
                      {t.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">{t.category}</td>
                    <td className="px-4 py-3.5 text-text-secondary">{t.assignee}</td>
                    <td className="px-4 py-3.5">
                      <SlaCell sla={t.sla} />
                    </td>
                    <td className="px-4 py-3.5 text-text-secondary">{t.created}</td>
                    <td className="px-4 py-3.5 text-right">
                      <RowActionsMenu
                        onReminder={() => handleReminder(t)}
                        onEscalate={() => handleEscalate(t)}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>

      <ToastStack toasts={toasts} />
    </>
  );
}
