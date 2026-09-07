import { useEffect } from "react";
import { X } from "lucide-react";
import { PriorityBadge, StatusBadge } from "./Badge";

export default function TicketDetailDrawer({ ticket, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
              {ticket.ticket_id}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{ticket.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-auto px-6 py-6">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Assignee</dt>
              <dd className="mt-1 text-ink">{ticket.assignee}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Category</dt>
              <dd className="mt-1 text-ink">{ticket.category}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Created</dt>
              <dd className="mt-1 text-ink">{ticket.created}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">SLA</dt>
              <dd className="mt-1 text-ink">{ticket.sla?.label ?? "—"}</dd>
            </div>
          </dl>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Work notes</p>
            <div className="mt-2 min-h-[6rem] rounded-md border border-surface-border bg-surface-muted p-3 text-sm text-ink-secondary">
              {ticket.work_notes || "No work notes yet."}
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border px-6 py-4">
          <p className="text-xs text-ink-muted">
            This ticket is managed directly in our system. Editing assignee, status, and work
            notes here arrives in a later phase — for now this is a read-only view.
          </p>
        </div>
      </div>
    </div>
  );
}
