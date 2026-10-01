import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Sparkles, Loader2, ExternalLink } from "lucide-react";
import Topbar from "../components/layout/Topbar";
import { fetchIssueOptions, createIssue, findSimilarIssues } from "../services/issuesService";

const EMPTY_FORM = {
  short_description: "",
  issue_type: "",
  classification: "",
  priority: "",
  issue_rating: "",
  description: "",
};

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-pill-critical"> *</span>}
      </span>
      {children}
    </label>
  );
}

const selectClass =
  "w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand";

function labelFor(list, value) {
  return list.find((o) => o.value === value)?.label || "";
}

export default function CreateIssuePage() {
  const [options, setOptions] = useState({
    classification: [],
    priority: [],
    issue_type: [],
    issue_rating: [],
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarValidation, setSimilarValidation] = useState(null);
  const [similarError, setSimilarError] = useState(null);
  const [similarMatches, setSimilarMatches] = useState(null);

  useEffect(() => {
    fetchIssueOptions().then(setOptions).catch(() => {});
  }, []);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleShowSimilar = async () => {
    setSimilarError(null);
    setSimilarMatches(null);

    if (!form.short_description.trim() || !form.description.trim()) {
      setSimilarValidation(
        "Please fill in Observation Heading and Observation Description to find similar incidents.",
      );
      return;
    }
    setSimilarValidation(null);
    setSimilarLoading(true);

    try {
      const payload = {
        observation_heading: form.short_description,
        observation_description: form.description,
        observation_category: labelFor(options.issue_type, form.issue_type),
        classification: labelFor(options.classification, form.classification),
        priority: labelFor(options.priority, form.priority),
        issue_rating: labelFor(options.issue_rating, form.issue_rating),
      };
      const data = await findSimilarIssues(payload);
      setSimilarMatches(data.matches || []);
    } catch (err) {
      setSimilarError(err.message);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const created = await createIssue(form);
      setResult(created);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar eyebrow="Compliance Workspace" title="Create Issue" />

      <main className="flex-1 overflow-auto bg-surface p-8">
        <div className="mx-auto max-w-2xl">
          {result && (
            <div className="mb-6 flex items-start gap-2.5 rounded-md border border-pill-resolved-bg bg-pill-resolved-bg px-4 py-3 text-sm text-pill-resolved">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
              <span>
                Issue created:{" "}
                {result.issue_url ? (
                  <a href={result.issue_url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {result.number}
                  </a>
                ) : (
                  <span className="font-medium">{result.number}</span>
                )}
              </span>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-4 py-3 text-sm text-pill-critical">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
              <span>Couldn&apos;t create the issue ({error}).</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-surface-border bg-surface p-6">
            <Field label="Observation Heading" required>
              <input
                required
                maxLength={160}
                value={form.short_description}
                onChange={setField("short_description")}
                placeholder="Short summary of the observation"
                className="w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-brand"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Observation Category">
                <select value={form.issue_type} onChange={setField("issue_type")} className={selectClass}>
                  <option value="">-- None --</option>
                  {options.issue_type.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Classification">
                <select value={form.classification} onChange={setField("classification")} className={selectClass}>
                  <option value="">-- None --</option>
                  {options.classification.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Priority">
                <select value={form.priority} onChange={setField("priority")} className={selectClass}>
                  <option value="">-- None --</option>
                  {options.priority.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Issue Rating">
                <select value={form.issue_rating} onChange={setField("issue_rating")} className={selectClass}>
                  <option value="">-- None --</option>
                  {options.issue_rating.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Observation Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={setField("description")}
                placeholder="Detailed description of the observation"
                className="w-full rounded-md border border-surface-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none focus:border-brand"
              />
            </Field>

            {similarValidation && (
              <div className="flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-4 py-3 text-sm text-pill-critical">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
                <span>{similarValidation}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                {submitting ? "Creating…" : "Create Issue"}
              </button>

              <button
                type="button"
                onClick={handleShowSimilar}
                disabled={similarLoading}
                className="flex items-center gap-2 rounded-md border border-surface-border bg-surface px-4 py-2.5 text-sm font-medium text-ink-secondary transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
              >
                {similarLoading ? (
                  <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
                ) : (
                  <Sparkles size={16} strokeWidth={1.75} />
                )}
                {similarLoading ? "Searching…" : "Show Similar Incidents"}
              </button>
            </div>
          </form>

          {similarLoading && (
            <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface p-6 text-sm text-ink-muted">
              <Loader2 size={16} strokeWidth={1.75} className="animate-spin shrink-0" />
              <span>Searching for similar incidents… this can take up to 10 seconds.</span>
            </div>
          )}

          {similarError && (
            <div className="mt-6 flex items-start gap-2.5 rounded-md border border-pill-critical-bg bg-pill-critical-bg px-4 py-3 text-sm text-pill-critical">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" strokeWidth={1.75} />
              <span>Couldn&apos;t fetch similar incidents ({similarError}).</span>
            </div>
          )}

          {similarMatches && (
            <div className="mt-6 rounded-lg border border-surface-border bg-surface p-6">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-ink-muted">
                Similar Incidents
              </p>

              {similarMatches.length === 0 ? (
                <p className="text-sm text-ink-muted">No similar incidents found.</p>
              ) : (
                <div className="space-y-3">
                  {similarMatches.map((m) => (
                    <div
                      key={m.issue_id}
                      className="rounded-md border border-surface-border p-4 transition-colors hover:border-brand/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {m.issue_url ? (
                          <a
                            href={m.issue_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-medium text-brand hover:underline"
                          >
                            {m.issue_id}
                            <ExternalLink size={12} strokeWidth={1.75} />
                          </a>
                        ) : (
                          <span className="font-medium text-ink">{m.issue_id}</span>
                        )}
                        {typeof m.score === "number" && (
                          <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand">
                            {(m.score * 100).toFixed(1)}% match
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-ink">{m.title}</p>
                      {m.description && (
                        <p className="mt-1 line-clamp-3 text-sm text-ink-secondary">{m.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
