# GRC Issue Integration (sn_grc_issue)

## What changed and why

The app originally pulled `incident` records for the Tickets page. We pivoted
the entire tickets/dashboard feature to ServiceNow's **Compliance Workspace**
Issues instead — table `sn_grc_issue` — because that's the real workflow the
business uses (**All → Compliance Workspace → Issues → All Issues → Create an
Issue**). This is a full replace, not an additional data source: `incident` is
no longer used anywhere in the app.

Login/Register were also removed. There's no real auth in this phase anyway
(the old login only checked a hardcoded demo credential), so the gate added
friction without adding anything real. The app now opens straight to the
Tickets (Issues) list.

## How the field contract was determined

`sn_grc_issue` extends `planned_task` → `task`. Its own `sys_dictionary`
entries only cover GRC-specific fields — core fields like `short_description`,
`priority`, `state`, `opened_by` live on the ancestor tables and don't show up
if you query `sys_dictionary` filtered to `name=sn_grc_issue` alone.

The table dictionary also reports every field as `mandatory: false` — GRC
Issue's real requiredness is enforced by UI Policy on the Compliance Workspace
form, which isn't readable via the Table API without elevated access we didn't
have time to get. Instead, we captured the **live client-side form state**
(the workspace's own computed field descriptors — mandatory flags, choice
lists, labels) directly from the browser while creating a real test issue
(`IPT0020521`). That's the source of truth below, not the raw dictionary.

## Field contract — the 6 fields our Create Issue form uses

| Frontend label | ServiceNow field | Type | Notes |
|---|---|---|---|
| Observation Heading | `short_description` | string (max 160) | Only field ServiceNow itself enforces as mandatory |
| Observation Description | `description` | string (max 4000) | Free text |
| Classification | `classification` | choice | Compliance(1) / Risk(2) / Audit(3) / Vendor Risk(4) / Operational resilience(20) |
| Priority | `priority` | choice | 1-Critical / 2-High / 3-Moderate / 4-Low / 5-Planning |
| Observation Category | `issue_type` | choice | Labeled "Observation Category" in the workspace UI; 18 values (Control design effectiveness failure, Non-compliance to a policy, Data Breach, Fraud, etc. — see `app/mapping/issue_mapper.py`) |
| Issue Rating | `issue_rating` | **reference**, not a static choice — points at `sn_grc_issue_rating` | Value sent is the record's `sys_id`. This table drives an auto-calculated `due_date` via each rating's `remediation_timeframe` (in days). Never hardcode these sys_ids — fetched live on every options request. |

Never sent by the frontend (ServiceNow/business-rule populated): `number`,
`sys_id`, `state`, `opened_at`, `opened_by`, `due_date`, all `sys_*` audit
fields.

## Backend

- `app/integrations/servicenow.py` — `get_issues()`, `create_issue()`,
  `get_issue_ratings()` (live reference-table fetch), all against
  `sn_grc_issue` / `sn_grc_issue_rating`.
- `app/mapping/issue_mapper.py` — `map_issue()` (list mapping) and
  `build_create_payload()` (form → ServiceNow field names), plus the
  confirmed static choice lists (classification/priority/issue_type).
- `app/mapping/sla.py` — same placeholder SLA heuristic as before
  (priority + opened_at), window hours updated for the real priority scale
  (Critical 1h / High 4h / Moderate 8h / Low 24h / Planning 72h).
- `app/routes/issues.py`:
  - `GET /api/issues` — list, mock fallback if ServiceNow isn't configured/reachable.
  - `GET /api/issues/options` — dropdown data for the create form.
  - `POST /api/issues` — create; returns `{ number, sys_id, issue_url }`.

## Frontend

- `src/services/issuesService.js` — `fetchIssues()`, `fetchIssueOptions()`, `createIssue()`.
- `src/pages/TicketsPage.jsx` — same table layout as before, now sourced from
  `sn_grc_issue`; status tabs and priority filter use the real state/priority
  scales (New/Analyze/Respond/Review/Closed Complete/Closed Incomplete).
- `src/pages/CreateIssuePage.jsx` — new page at `/issues/new`, reachable via
  the "Create Issue" sidebar item and the Tickets page's top-right button.

## Data volume — deliberate decision, not an oversight

The real `sn_grc_issue` table has ~2,676 records. `GET /api/issues` calls
`servicenow.get_issues(limit=50)` — it only pulls the **50 most recently
opened** issues (`ORDERBYDESCopened_at`), not the full table.

**Known limitation, accepted for now:** Search and the status/priority
filters on the Tickets page run entirely client-side, over whatever those 50
records happen to be. A search for an issue outside the most-recent 50 will
return zero results even though the issue exists in ServiceNow. We
considered pushing search/filtering into the ServiceNow query itself
(`sysparm_query`) with real pagination, which is the correct approach at this
table size, but explicitly chose to keep the simple recent-50 client-filtered
behavior for now rather than build that out. Revisit if/when global search
across the full table is actually needed.

## Still open / not yet resolved

- **Mandatory-in-practice fields beyond `short_description`** — without
  `sys_ui_policy` access, we relied on the live form dump rather than a full
  UI Policy audit. If the workspace later enforces more fields as mandatory
  (e.g. only under certain classifications), the create form and backend
  validation will need updating.
- **Row actions** (Send reminder / Escalate) remain mocked, same as the
  original incident-based design — only issue retrieval and creation are real.
- **Search/filter only covers the most recent 50 issues** — see "Data volume" above.
