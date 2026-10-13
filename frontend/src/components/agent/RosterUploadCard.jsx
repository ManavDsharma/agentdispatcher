import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  XCircle
} from "lucide-react";

const MATCH_BADGE = {
  exact: { label: "Matched", cls: "bg-green-100 text-green-700" },
  alias: { label: "Matched by name", cls: "bg-blue-100 text-blue-700" },
  fuzzy: { label: "Assumed — check", cls: "bg-amber-100 text-amber-700" },
  missing: { label: "Not found", cls: "bg-surface-muted text-ink-muted" }
};

const PREVIEW_LABELS = {
  team_id: "Team ID",
  emp_id: "Emp ID",
  employee_name: "Employee",
  year: "Year",
  month: "Month",
  days_availability: "Days",
  level: "Level",
  shift: "Shift",
  active: "Active"
};

function Pill({ kind, children }) {
  const badge = MATCH_BADGE[kind];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}
    >
      {children || badge.label}
    </span>
  );
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/**
 * Shows the result of validating an uploaded roster file, and — only when it
 * is valid — the button that actually writes it. Pure presentation: the page
 * owns the upload state and passes the handlers in.
 *
 * status: "ready" | "committing" | "done" | "failed" | "cancelled"
 */
export default function RosterUploadCard({
  upload,
  status,
  result,
  error,
  onConfirm,
  onCancel
}) {
  const needsAttention = upload.columns.some(
    (c) => c.match === "fuzzy" || (c.match === "missing" && c.required)
  );
  const hiddenErrors = upload.error_count - upload.errors.length;
  const busy = status === "committing";

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg rounded-tl-none border border-surface-border bg-surface text-sm text-ink">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pb-3 pt-3">
        <FileSpreadsheet
          size={20}
          strokeWidth={1.75}
          className="mt-0.5 shrink-0 text-brand"
        />
        <div className="min-w-0">
          <p className="truncate font-semibold">{upload.file_name}</p>
          <p className="text-xs text-ink-muted">
            Roster upload · sheet “{upload.sheet_name}” · header on row{" "}
            {upload.header_row}
          </p>
        </div>
      </div>

      {/* Verdict */}
      <div className="px-4 pb-3">
        {upload.can_commit ? (
          <p className="flex items-start gap-1.5 text-green-800">
            <CheckCircle2
              size={16}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0"
            />
            <span>
              The file looks good: <strong>{plural(upload.valid_rows, "row")}</strong> for{" "}
              {plural(upload.summary.employees, "employee")} across{" "}
              {plural(upload.summary.teams.length, "team")}
              {upload.summary.periods.length > 0 &&
                ` (${upload.summary.periods.join(", ")})`}
              .
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-1.5 text-red-800">
            <XCircle
              size={16}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0"
            />
            <span>
              This file can’t be uploaded yet —{" "}
              <strong>{plural(upload.error_count, "problem")}</strong> to fix
              first. Nothing was changed.
            </span>
          </p>
        )}
      </div>

      {/* Errors */}
      {upload.errors.length > 0 && (
        <div className="border-t border-surface-border bg-red-50/60 px-4 py-3">
          <ul className="space-y-1 text-xs text-red-800">
            {upload.errors.map((e, i) => (
              <li key={i}>
                <span className="font-semibold">Row {e.row}</span>
                {e.column && <> · {e.column}</>}: {e.message}
              </li>
            ))}
          </ul>
          {hiddenErrors > 0 && (
            <p className="mt-2 text-xs text-red-700">
              …and {plural(hiddenErrors, "more problem")}.
            </p>
          )}
        </div>
      )}

      {/* Warnings */}
      {upload.warnings.length > 0 && (
        <div className="border-t border-surface-border bg-amber-50/70 px-4 py-3">
          <ul className="space-y-1 text-xs text-amber-900">
            {upload.warnings.map((w, i) => (
              <li key={i} className="flex gap-1.5">
                <AlertTriangle
                  size={13}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0"
                />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Column mapping */}
      <details
        open={needsAttention}
        className="border-t border-surface-border px-4 py-2.5"
      >
        <summary className="cursor-pointer select-none text-xs font-medium text-ink-secondary">
          How the columns were read
        </summary>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-ink-muted">
              <th className="py-1 pr-3 font-semibold">Expected</th>
              <th className="py-1 pr-3 font-semibold">In your file</th>
              <th className="py-1 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {upload.columns.map((c) => (
              <tr key={c.expected} className="border-t border-surface-border">
                <td className="py-1 pr-3">
                  {c.expected}
                  {c.required && <span className="text-red-600"> *</span>}
                </td>
                <td className="py-1 pr-3 text-ink-secondary">
                  {c.found || "—"}
                </td>
                <td className="py-1 text-right">
                  <Pill kind={c.match} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      {/* Preview */}
      {upload.preview.length > 0 && (
        <div className="border-t border-surface-border">
          <p className="px-4 pt-2.5 text-xs font-medium text-ink-secondary">
            Preview (first {upload.preview.length} of {upload.valid_rows || upload.total_rows})
          </p>
          <div className="overflow-x-auto pb-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-muted">
                  {upload.preview_fields.map((f) => (
                    <th key={f} className="whitespace-nowrap px-4 py-1.5 font-semibold">
                      {PREVIEW_LABELS[f] || f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upload.preview.map((row, i) => (
                  <tr key={i} className="border-t border-surface-border">
                    {upload.preview_fields.map((f) => (
                      <td key={f} className="whitespace-nowrap px-4 py-1.5">
                        {row[f] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions / outcome */}
      <div className="border-t border-surface-border bg-surface-muted px-4 py-3">
        {status === "done" ? (
          <div className="space-y-1 text-green-800">
            <p className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={16} strokeWidth={1.75} />
              Added {plural(result.written, "row")} to the roster.
            </p>
            {result.source === "mock" && (
              <p className="flex gap-1.5 text-xs text-amber-800">
                <AlertTriangle size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                <span>
                  The roster table isn’t configured on the backend
                  (<code>ROSTER_TABLE_NAME</code>), so this went to the temporary demo store
                  only — it is not saved to DynamoDB and is lost on restart.
                </span>
              </p>
            )}
          </div>
        ) : status === "cancelled" ? (
          <p className="text-ink-muted">Cancelled — nothing was changed.</p>
        ) : upload.can_commit ? (
          <div className="space-y-2">
            {status === "failed" && error && (
              <p className="flex gap-1.5 text-xs text-red-700">
                <XCircle size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {busy
                  ? "Updating roster…"
                  : status === "failed"
                    ? "Retry update"
                    : `Confirm & update roster (${plural(upload.valid_rows, "row")})`}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-md border border-surface-border bg-surface px-3.5 py-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-secondary">
            Fix the problems above in your spreadsheet, then attach it again.
          </p>
        )}
      </div>
    </div>
  );
}
