
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  AlertTriangle,
  Info,
  Download,
  Filter,
  X,
} from "lucide-react";

import Topbar from "../components/layout/Topbar";
import { PriorityBadge, StatusBadge } from "../components/tickets/Badge";
import SlaCell from "../components/tickets/SlaCell";
import RowActionsMenu from "../components/tickets/RowActionsMenu";
import ToastStack from "../components/tickets/ToastStack";
import TicketDetailDrawer from "../components/tickets/TicketDetailDrawer";

import { fetchTickets } from "../services/ticketsService";
import {
  fetchCategorizationMatrix,
  fetchRoster,
} from "../services/referenceService";

let toastId = 0;

/* ============================================================
   CSV EXPORT
   ============================================================ */

/**
 * Safely converts any value into a CSV cell.
 *
 * CSV requires values containing commas, quotes, or line breaks
 * to be wrapped in double quotes. Existing quotes are doubled.
 */
function csvCell(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Creates and downloads a CSV file in the browser.
 */
function downloadCsv(rows, filename) {
  if (!rows.length) return;

  const headers = [
    "Ticket ID",
    "Source System",
    "URL",
    "Management Mode",
    "Short Description",
    "Description",
    "Category",
    "Sub Category",
    "Priority",
    "Urgency",
    "Impact",
    "State",
    "Assigned To",
    "Opened By",
    "Opened For",
    "Team ID",
    "Working Notes",
    "Created At",
    "Updated At",
    "Closed At",
    "Assignment Duration",
    "Assignment SLA",
    "Resolution Duration",
    "Resolution SLA",
    "Assignment SLA Breach",
    "Resolution SLA Breach",
  ];

  const dataRows = rows.map((ticket) => [
    ticket.ticket_id,
    ticket.source_system,
    ticket.url,
    ticket.management_mode,
    ticket.short_description,
    ticket.description,
    ticket.category,
    ticket.sub_category,
    ticket.priority,
    ticket.urgency,
    ticket.impact,
    ticket.state,
    ticket.assigned_to,
    ticket.opened_by,
    ticket.opened_for,
    ticket.team_id,
    ticket.working_notes,
    ticket.created_at,
    ticket.updated_at,
    ticket.closed_at,
    ticket.assignment_duration,
    ticket.assignment_sla,
    ticket.resolution_duration,
    ticket.resolution_sla,
    ticket.has_assignment_sla_breach ? "Yes" : "No",
    ticket.has_resolution_sla_breach ? "Yes" : "No",
  ]);

  const csvContent = [
    headers.map(csvCell).join(","),
    ...dataRows.map((row) => row.map(csvCell).join(",")),
  ].join("\r\n");

  // UTF-8 BOM helps Microsoft Excel correctly identify UTF-8 CSV files.
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* ============================================================
   FILTER HELPERS
   ============================================================ */

function uniqueSortedValues(tickets, field) {
  return Array.from(
    new Set(
      tickets
        .map((ticket) => ticket[field])
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => String(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label className="block min-w-[170px] flex-1">
      <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
      >
        <option value="">{allLabel}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ============================================================
   PAGE
   ============================================================ */

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);

  const [meta, setMeta] = useState({
    source: null,
    reason: null,
    error: null,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* ----------------------------------------------------------
     Existing filters
     ---------------------------------------------------------- */

  const [statusTab, setStatusTab] = useState("All");
  const [priority, setPriority] = useState("All Priorities");
  const [search, setSearch] = useState("");

  /* ----------------------------------------------------------
     Advanced filters
     ---------------------------------------------------------- */

  const [showFilters, setShowFilters] = useState(false);

  const [teamFilter, setTeamFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [impactFilter, setImpactFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [slaFilter, setSlaFilter] = useState("");
  const [sourceSystemFilter, setSourceSystemFilter] = useState("");
  const [managementModeFilter, setManagementModeFilter] = useState("");

  /* ----------------------------------------------------------
     UI state
     ---------------------------------------------------------- */

  const [toasts, setToasts] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [categorizationMatrix, setCategorizationMatrix] = useState([]);
  const [roster, setRoster] = useState([]);

  /* ============================================================
     LOAD TICKETS
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    fetchTickets()
      .then((data) => {
        if (cancelled) return;

        setTickets(data.tickets ?? []);

        setMeta({
          source: data.source,
          reason: data.reason,
          error: data.error,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     LOAD REFERENCE DATA
     ============================================================ */

  useEffect(() => {
    let cancelled = false;

    fetchCategorizationMatrix()
      .then((data) => {
        if (!cancelled) {
          setCategorizationMatrix(data.items ?? []);
        }
      })
      .catch(() => {});

    fetchRoster()
      .then((data) => {
        if (!cancelled) {
          setRoster(data.items ?? []);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  /* ============================================================
     FILTER OPTIONS
     ============================================================ */

  const statusTabs = useMemo(() => {
    const values = uniqueSortedValues(tickets, "state");
    return ["All", ...values];
  }, [tickets]);

  const priorityOptions = useMemo(() => {
    const values = uniqueSortedValues(tickets, "priority");
    return ["All Priorities", ...values];
  }, [tickets]);

  const teamOptions = useMemo(
    () => uniqueSortedValues(tickets, "team_id"),
    [tickets],
  );

  const assigneeOptions = useMemo(
    () => uniqueSortedValues(tickets, "assigned_to"),
    [tickets],
  );

  const categoryOptions = useMemo(
    () => uniqueSortedValues(tickets, "category"),
    [tickets],
  );

  const subCategoryOptions = useMemo(
    () => uniqueSortedValues(tickets, "sub_category"),
    [tickets],
  );

  const impactOptions = useMemo(
    () => uniqueSortedValues(tickets, "impact"),
    [tickets],
  );

  const urgencyOptions = useMemo(
    () => uniqueSortedValues(tickets, "urgency"),
    [tickets],
  );

  const sourceSystemOptions = useMemo(
    () => uniqueSortedValues(tickets, "source_system"),
    [tickets],
  );

  /* ============================================================
     STATUS COUNTS
     ============================================================ */

  const tabCounts = useMemo(() => {
    const counts = {
      All: tickets.length,
    };

    for (const ticket of tickets) {
      counts[ticket.state] = (counts[ticket.state] ?? 0) + 1;
    }

    return counts;
  }, [tickets]);

  /* ============================================================
     ADVANCED FILTER COUNT
     ============================================================ */

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (teamFilter) count++;
    if (assigneeFilter) count++;
    if (categoryFilter) count++;
    if (subCategoryFilter) count++;
    if (impactFilter) count++;
    if (urgencyFilter) count++;
    if (slaFilter) count++;
    if (sourceSystemFilter) count++;
    if (managementModeFilter) count++;

    return count;
  }, [
    teamFilter,
    assigneeFilter,
    categoryFilter,
    subCategoryFilter,
    impactFilter,
    urgencyFilter,
    slaFilter,
    sourceSystemFilter,
    managementModeFilter,
  ]);

  /* ============================================================
     FILTERED TICKETS
     ============================================================ */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      /* Status */
      if (statusTab !== "All" && ticket.state !== statusTab) {
        return false;
      }

      /* Priority */
      if (
        priority !== "All Priorities" &&
        ticket.priority !== priority
      ) {
        return false;
      }

      /* Search */
      if (
        q &&
        !`${ticket.ticket_id}
          ${ticket.short_description}
          ${ticket.description}
          ${ticket.assigned_to}
          ${ticket.team_id}
          ${ticket.category}
          ${ticket.sub_category}
          ${ticket.opened_by}
          ${ticket.opened_for}`.toLowerCase().includes(q)
      ) {
        return false;
      }

      /* Team */
      if (teamFilter && ticket.team_id !== teamFilter) {
        return false;
      }

      /* Assignee */
      if (assigneeFilter && ticket.assigned_to !== assigneeFilter) {
        return false;
      }

      /* Category */
      if (categoryFilter && ticket.category !== categoryFilter) {
        return false;
      }

      /* Sub-category */
      if (
        subCategoryFilter &&
        ticket.sub_category !== subCategoryFilter
      ) {
        return false;
      }

      /* Impact */
      if (impactFilter && ticket.impact !== impactFilter) {
        return false;
      }

      /* Urgency */
      if (urgencyFilter && ticket.urgency !== urgencyFilter) {
        return false;
      }

      /* SLA */
      if (slaFilter === "breached") {
        if (
          !ticket.has_assignment_sla_breach &&
          !ticket.has_resolution_sla_breach
        ) {
          return false;
        }
      }

      if (slaFilter === "not_breached") {
        if (
          ticket.has_assignment_sla_breach ||
          ticket.has_resolution_sla_breach
        ) {
          return false;
        }
      }

      /* Source system */
      if (
        sourceSystemFilter &&
        ticket.source_system !== sourceSystemFilter
      ) {
        return false;
      }

      /* Management mode */
      if (
        managementModeFilter &&
        ticket.management_mode !== managementModeFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    tickets,
    statusTab,
    priority,
    search,
    teamFilter,
    assigneeFilter,
    categoryFilter,
    subCategoryFilter,
    impactFilter,
    urgencyFilter,
    slaFilter,
    sourceSystemFilter,
    managementModeFilter,
  ]);

  /* ============================================================
     CLEAR FILTERS
     ============================================================ */

  const clearFilters = () => {
    setStatusTab("All");
    setPriority("All Priorities");
    setSearch("");

    setTeamFilter("");
    setAssigneeFilter("");
    setCategoryFilter("");
    setSubCategoryFilter("");
    setImpactFilter("");
    setUrgencyFilter("");
    setSlaFilter("");
    setSourceSystemFilter("");
    setManagementModeFilter("");
  };

  /* ============================================================
     EXPORT
     ============================================================ */

  const handleExport = () => {
    if (!filtered.length) {
      pushToast("There are no tickets to export.");
      return;
    }

    const now = new Date();

    const datePart = now
      .toISOString()
      .slice(0, 10);

    const timePart = now
      .toTimeString()
      .slice(0, 8)
      .replace(/:/g, "-");

    const filename = `tickets_${datePart}_${timePart}.csv`;

    downloadCsv(filtered, filename);

    pushToast(`${filtered.length} ticket(s) exported to CSV.`);
  };

  /* ============================================================
     TOASTS
     ============================================================ */

  function pushToast(message) {
    const id = ++toastId;

    setToasts((current) => [
      ...current,
      {
        id,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((current) =>
        current.filter((toast) => toast.id !== id),
      );
    }, 2800);
  }

  /* ============================================================
     ROW ACTIONS
     ============================================================ */

  const handleReminder = (ticket) => {
    console.log("Send reminder email", {
      ticketId: ticket.ticket_id,
      assignee: ticket.assigned_to,
    });

    pushToast(
      `Reminder email queued for ${
        ticket.assigned_to === "Unassigned"
          ? ticket.ticket_id
          : ticket.assigned_to
      }.`,
    );
  };

  const handleEscalate = (ticket) => {
    if (
      !window.confirm(
        `Escalate ${ticket.ticket_id}? This will notify the on-call lead.`,
      )
    ) {
      return;
    }

    console.log("Escalate", {
      ticketId: ticket.ticket_id,
      priority: ticket.priority,
    });

    pushToast(`${ticket.ticket_id} escalated.`);
  };

  const handleTicketSaved = (updated) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.ticket_id === updated.ticket_id
          ? updated
          : ticket,
      ),
    );

    setSelectedTicket(updated);

    pushToast(`${updated.ticket_id} updated.`);
  };

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>
      <Topbar
        eyebrow="Support Ops"
        title="Tickets"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 rounded-md border border-surface-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              title={
                filtered.length
                  ? `Export ${filtered.length} filtered ticket(s)`
                  : "No tickets to export"
              }
            >
              <Download size={16} strokeWidth={1.75} />
              Export CSV
            </button>

            <button
              disabled
              title="Coming soon"
              className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              <Plus size={16} strokeWidth={2} />
              New Ticket
            </button>
          </div>
        }
      />

      <main className="flex-1 overflow-auto bg-surface p-8">
        {/* =====================================================
            DATA WARNINGS
            ===================================================== */}

        {meta.reason === "connection_error" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-4 py-3 text-sm text-pill-critical">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0"
              strokeWidth={1.75}
            />

            <span>
              Couldn&apos;t reach the ticket database ({meta.error}).
              Showing mock data instead.
            </span>
          </div>
        )}

        {meta.reason === "not_configured" && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-surface-border bg-surface-muted px-4 py-3 text-sm text-ink-secondary">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-ink-muted"
              strokeWidth={1.75}
            />

            <span>
              Ticket database isn&apos;t configured yet — showing mock
              data. Add DYNAMODB_TABLE_NAME to backend/.env to connect.
            </span>
          </div>
        )}

        {loadError && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-4 py-3 text-sm text-pill-critical">
            <AlertTriangle
              size={16}
              className="mt-0.5 shrink-0"
              strokeWidth={1.75}
            />

            <span>
              Couldn&apos;t reach the backend ({loadError}).
            </span>
          </div>
        )}

        {/* =====================================================
            STATUS TABS
            ===================================================== */}

        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                statusTab === tab
                  ? "bg-brand text-white"
                  : "text-ink-secondary hover:bg-surface-hover hover:text-ink"
              }`}
            >
              {tab}

              <span
                className={
                  statusTab === tab
                    ? "ml-1 text-white/80"
                    : "ml-1 text-ink-muted"
                }
              >
                {tabCounts[tab] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* =====================================================
            SEARCH + PRIMARY FILTERS + ACTIONS
            ===================================================== */}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              strokeWidth={1.75}
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, assignee, team..."
              className="w-full rounded-md border border-surface-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-brand"
            />
          </div>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters((current) => !current)}
            className={`flex items-center gap-2 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-brand bg-brand-soft text-brand"
                : "border-surface-border bg-surface text-ink-secondary hover:bg-surface-hover hover:text-ink"
            }`}
          >
            <Filter size={16} strokeWidth={1.75} />

            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <X size={14} strokeWidth={1.75} />
              Clear filters
            </button>
          )}
        </div>

        {/* =====================================================
            ADVANCED FILTER PANEL
            ===================================================== */}

        {showFilters && (
          <div className="mb-5 rounded-lg border border-surface-border bg-surface-muted/40 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Filter tickets
                </h3>

                <p className="mt-0.5 text-xs text-ink-muted">
                  Narrow the ticket list using multiple criteria.
                </p>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <FilterSelect
                label="Team"
                value={teamFilter}
                onChange={setTeamFilter}
                options={teamOptions}
                allLabel="All Teams"
              />

              <FilterSelect
                label="Assignee"
                value={assigneeFilter}
                onChange={setAssigneeFilter}
                options={assigneeOptions}
                allLabel="All Assignees"
              />

              <FilterSelect
                label="Category"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
                allLabel="All Categories"
              />

              <FilterSelect
                label="Sub-category"
                value={subCategoryFilter}
                onChange={setSubCategoryFilter}
                options={subCategoryOptions}
                allLabel="All Sub-categories"
              />

              <FilterSelect
                label="Impact"
                value={impactFilter}
                onChange={setImpactFilter}
                options={impactOptions}
                allLabel="All Impact"
              />

              <FilterSelect
                label="Urgency"
                value={urgencyFilter}
                onChange={setUrgencyFilter}
                options={urgencyOptions}
                allLabel="All Urgency"
              />

              <label className="block min-w-[170px] flex-1">
                <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                  SLA
                </span>

                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
                >
                  <option value="">All SLA</option>
                  <option value="breached">SLA Breached</option>
                  <option value="not_breached">No SLA Breach</option>
                </select>
              </label>

              <FilterSelect
                label="Source System"
                value={sourceSystemFilter}
                onChange={setSourceSystemFilter}
                options={sourceSystemOptions}
                allLabel="All Source Systems"
              />

              <label className="block min-w-[170px] flex-1">
                <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                  Management
                </span>

                <select
                  value={managementModeFilter}
                  onChange={(e) =>
                    setManagementModeFilter(e.target.value)
                  }
                  className="w-full rounded-md border border-surface-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-brand"
                >
                  <option value="">All Management Modes</option>
                  <option value="internal_edit">
                    Internal Edit
                  </option>
                  <option value="external_redirect">
                    External Redirect
                  </option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* =====================================================
            RESULT SUMMARY
            ===================================================== */}

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Showing{" "}
            <span className="font-semibold text-ink">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-ink">
              {tickets.length}
            </span>{" "}
            tickets
          </p>

          {activeFilterCount > 0 && (
            <p className="text-xs text-brand">
              Filters applied
            </p>
          )}
        </div>

        {/* =====================================================
            TICKET TABLE
            ===================================================== */}

        <div className="overflow-hidden rounded-lg border border-surface-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-muted text-left text-[11px] uppercase tracking-widest text-ink-muted">
                <th className="px-4 py-3 font-medium">
                  Ticket ID
                </th>

                <th className="px-4 py-3 font-medium">
                  Title
                </th>

                <th className="px-4 py-3 font-medium">
                  Priority
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

                <th className="px-4 py-3 font-medium">
                  Category
                </th>

                <th className="px-4 py-3 font-medium">
                  Assignee
                </th>

                <th className="px-4 py-3 font-medium">
                  Resolution SLA
                </th>

                <th className="px-4 py-3 font-medium">
                  Created
                </th>

                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>

            <tbody>
              {/* Loading */}
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-surface-border last:border-0"
                  >
                    {Array.from({ length: 9 }).map(
                      (__, j) => (
                        <td
                          key={j}
                          className="px-4 py-3.5"
                        >
                          <div className="h-3.5 w-full animate-pulse rounded bg-surface-muted" />
                        </td>
                      ),
                    )}
                  </tr>
                ))}

              {/* Empty */}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm text-ink-muted"
                  >
                    No tickets match your filters.
                  </td>
                </tr>
              )}

              {/* Data */}
              {!loading &&
                filtered.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="border-b border-surface-border last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-4 py-3.5 font-medium">
                      {ticket.management_mode ===
                      "internal_edit" ? (
                        <button
                          onClick={() =>
                            setSelectedTicket(ticket)
                          }
                          className="text-brand hover:underline"
                        >
                          {ticket.ticket_id}
                        </button>
                      ) : ticket.url ? (
                        <a
                          href={ticket.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand hover:underline"
                        >
                          {ticket.ticket_id}
                        </a>
                      ) : (
                        <span
                          className="text-ink-secondary"
                          title="No source URL on record"
                        >
                          {ticket.ticket_id}
                        </span>
                      )}
                    </td>

                    <td
                      className="max-w-xs truncate px-4 py-3.5 text-ink"
                      title={ticket.short_description}
                    >
                      {ticket.short_description}
                    </td>

                    <td className="px-4 py-3.5">
                      <PriorityBadge
                        priority={ticket.priority}
                      />
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusBadge status={ticket.state} />
                    </td>

                    <td className="px-4 py-3.5 text-ink-secondary">
                      {ticket.category}
                    </td>

                    <td className="px-4 py-3.5 text-ink-secondary">
                      {ticket.assigned_to}
                    </td>

                    <td className="px-4 py-3.5">
                      <SlaCell
                        value={ticket.resolution_sla}
                        breached={
                          ticket.has_resolution_sla_breach
                        }
                      />
                    </td>

                    <td className="px-4 py-3.5 text-ink-secondary">
                      {ticket.created_at}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <RowActionsMenu
                        onReminder={() =>
                          handleReminder(ticket)
                        }
                        onEscalate={() =>
                          handleEscalate(ticket)
                        }
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* =======================================================
          TOASTS
          ======================================================= */}

      <ToastStack toasts={toasts} />

      {/* =======================================================
          TICKET DETAIL DRAWER
          ======================================================= */}

      {selectedTicket && (
        <TicketDetailDrawer
          key={selectedTicket.ticket_id}
          ticket={selectedTicket}
          categorizationMatrix={categorizationMatrix}
          roster={roster}
          onClose={() => setSelectedTicket(null)}
          onSaved={handleTicketSaved}
        />
      )}
    </>
  );
}
