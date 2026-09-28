import { useMemo, useState, useEffect } from "react";
import { X, AlertTriangle, Pencil } from "lucide-react";
import { PriorityBadge, StatusBadge } from "./Badge";
import { updateTicket } from "../../services/ticketsService";
import { computePriority } from "../../utils/priorityMatrix";

const IMPACT_URGENCY_OPTIONS = ["High", "Medium", "Low"];
const STATE_OPTIONS = ["New", "In Progress", "On Hold", "Resolved", "Closed", "Canceled"];

function withCurrent(options, current) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

function subCategoriesFor(matrix, category) {
  return Array.from(
    new Set(matrix.filter((m) => m.category_name === category).map((m) => m.sub_category_name).filter(Boolean)),
  ).sort();
}

function teamIdsFor(matrix, category, subCategory) {
  const matches = matrix.filter((m) => m.category_name === category && m.sub_category_name === subCategory);
  const pool = matches.length ? matches : matrix;
  return Array.from(new Set(pool.map((m) => m.team_id).filter(Boolean))).sort();
}

function employeeNamesFor(roster, teamId) {
  return Array.from(new Set(roster.filter((r) => r.team_id === teamId).map((r) => r.employee_name).filter(Boolean))).sort();
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-surface-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition-colors focus:border-brand";

function ReadOnly({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

export default function TicketDetailDrawer({ ticket, categorizationMatrix, roster, onClose, onSaved }) {
  const matrix = categorizationMatrix ?? [];
  const employees = roster ?? [];

  const [shortDescription, setShortDescription] = useState(ticket.short_description || "");
  const [description, setDescription] = useState(ticket.description || "");
  const [category, setCategory] = useState(ticket.category || "");
  const [subCategory, setSubCategory] = useState(ticket.sub_category || "");
  const [teamId, setTeamId] = useState(ticket.team_id || "");
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || "");
  const [urgency, setUrgency] = useState(ticket.urgency || "");
  const [impact, setImpact] = useState(ticket.impact || "");
  const [state, setState] = useState(ticket.state || "");
  const [openedBy, setOpenedBy] = useState(ticket.opened_by || "");
  const [openedFor, setOpenedFor] = useState(ticket.opened_for || "");
  const [workingNotes, setWorkingNotes] = useState(ticket.working_notes || "");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const categoryOptions = useMemo(
    () => withCurrent(Array.from(new Set(matrix.map((m) => m.category_name).filter(Boolean))).sort(), category),
    [matrix, category],
  );
  const subCategoryOptions = useMemo(
    () => withCurrent(subCategoriesFor(matrix, category), subCategory),
    [matrix, category, subCategory],
  );
  // Team ID is mapped to category + sub-category via the categorization
  // matrix — only the team(s) that actually handle the selected
  // category/sub-category combination should show up here.
  const teamIdOptions = useMemo(
    () => withCurrent(teamIdsFor(matrix, category, subCategory), teamId),
    [matrix, category, subCategory, teamId],
  );
  const assigneeOptions = useMemo(() => {
    const options = withCurrent(employeeNamesFor(employees, teamId), assignedTo);
    return options.includes("Unassigned") ? options : ["Unassigned", ...options];
  }, [employees, teamId, assignedTo]);
  const stateOptions = useMemo(() => withCurrent(STATE_OPTIONS, state), [state]);
  const urgencyOptions = useMemo(() => withCurrent(IMPACT_URGENCY_OPTIONS, urgency), [urgency]);
  const impactOptions = useMemo(() => withCurrent(IMPACT_URGENCY_OPTIONS, impact), [impact]);

  // Priority is never directly editable — it's derived from Impact x Urgency.
  // Falls back to the ticket's currently-stored priority until both are set
  // to a recognized value, so the badge doesn't go blank mid-edit.
  const livePriority = computePriority(impact, urgency) || ticket.priority;

  // Changing an upstream field never auto-picks a downstream value for you —
  // it resets dependent fields to "Choose below" so you always make an
  // explicit choice instead of silently inheriting whatever happened to be
  // first in the list.
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setSubCategory("");
    setTeamId("");
    setAssignedTo("");
  };

  const handleSubCategoryChange = (newSub) => {
    setSubCategory(newSub);
    setTeamId("");
    setAssignedTo("");
  };

  const handleTeamIdChange = (newTeam) => {
    setTeamId(newTeam);
    setAssignedTo("");
  };

  const handleSave = async () => {
    if (!subCategory || !teamId || !assignedTo) {
      setSaveError("Choose sub-category, team, and assignee before saving.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateTicket(ticket.ticket_id, {
        short_description: shortDescription,
        description,
        category,
        sub_category: subCategory,
        team_id: teamId,
        assigned_to: assignedTo,
        urgency,
        impact,
        state,
        opened_by: openedBy,
        opened_for: openedFor,
        working_notes: workingNotes,
      });
      onSaved(updated);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-lg flex-col bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
              {ticket.ticket_id}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{ticket.short_description}</h2>
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
            <PriorityBadge priority={livePriority} />
            <StatusBadge status={state} />
          </div>

          <dl className="grid grid-cols-3 gap-4 rounded-md border border-surface-border bg-surface-muted p-4">
            <ReadOnly label="Created" value={ticket.created_at} />
            <ReadOnly label="Updated" value={ticket.updated_at} />
            <ReadOnly label="Closed" value={ticket.closed_at} />
          </dl>

          <dl className="grid grid-cols-2 gap-4 rounded-md border border-surface-border p-4">
            <ReadOnly label="Assignment SLA" value={ticket.assignment_sla} />
            <ReadOnly label="Assignment duration" value={ticket.assignment_duration} />
            <ReadOnly label="Resolution SLA" value={ticket.resolution_sla} />
            <ReadOnly label="Resolution duration" value={ticket.resolution_duration} />
            <ReadOnly label="Assignment SLA breached" value={ticket.has_assignment_sla_breach ? "Yes" : "No"} />
            <ReadOnly label="Resolution SLA breached" value={ticket.has_resolution_sla_breach ? "Yes" : "No"} />
          </dl>

          <div className="space-y-4 border-t border-surface-border pt-6">
            <p
              className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-ink-muted"
              title="Editable"
            >
              <Pencil size={12} strokeWidth={2} />
              <span className="sr-only">Editable</span>
            </p>

            <Field label="Short description">
              <input
                className={inputClass}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </Field>

            <Field label="Description">
              <textarea
                className={`${inputClass} min-h-[5rem] resize-y`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category">
                <select className={inputClass} value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                  {categoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sub-category">
                <select
                  className={inputClass}
                  value={subCategory}
                  onChange={(e) => handleSubCategoryChange(e.target.value)}
                >
                  <option value="">Choose sub-category</option>
                  {subCategoryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Impact">
                <select className={inputClass} value={impact} onChange={(e) => setImpact(e.target.value)}>
                  {impactOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Urgency">
                <select className={inputClass} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
                  {urgencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <input
                  className={`${inputClass} cursor-not-allowed bg-surface-muted text-ink-muted opacity-60`}
                  value={livePriority}
                  disabled
                  readOnly
                  title="Derived from Impact + Urgency — not directly editable"
                />
              </Field>
              <Field label="State">
                <select className={inputClass} value={state} onChange={(e) => setState(e.target.value)}>
                  {stateOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Team ID">
                <select className={inputClass} value={teamId} onChange={(e) => handleTeamIdChange(e.target.value)}>
                  <option value="">Choose team</option>
                  {teamIdOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Assigned to">
                <select className={inputClass} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">Choose assignee</option>
                  {assigneeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Opened by">
                <input
                  className={inputClass}
                  value={openedBy}
                  onChange={(e) => setOpenedBy(e.target.value)}
                />
              </Field>
              <Field label="Opened for">
                <input
                  className={inputClass}
                  value={openedFor}
                  onChange={(e) => setOpenedFor(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Working notes">
              <textarea
                className={`${inputClass} min-h-[6rem] resize-y`}
                value={workingNotes}
                onChange={(e) => setWorkingNotes(e.target.value)}
              />
            </Field>
          </div>

          {saveError && (
            <div className="flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-3.5 py-2.5 text-xs text-pill-critical">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" strokeWidth={1.75} />
              <span>{saveError}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
