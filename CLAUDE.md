# Project: Agentic Support Portal

## What this is

A support-ops web app, conceptually similar to an L1-assistant we've built before, but standalone. This phase covers the **frontend + a real FastAPI backend reading tickets from DynamoDB**. The agentic/LangGraph layer behind the AI Agent page is a _later_ phase — for now that page stays static/mock.

**Architecture pivot (superseded an earlier ServiceNow-ingestion design):** we originally had the backend call the ServiceNow Table API directly (and, briefly, a fuller connector/sync-service layer that ingested ServiceNow into DynamoDB from our own backend). Both are gone. **DynamoDB is now the sole source of truth, populated by something outside this codebase** — we don't sync, poll, or ingest anything here. The backend only reads from DynamoDB (with a mock-data fallback) and writes back a small editable-field set for tickets we own. `app/integrations/`, `app/connectors/`, `app/mapping/`, and `app/services/sync_service.py` no longer exist.

## First step, before writing any code

Read this file fully, then read `docs/PRD.md`, then look at every image in `docs/reference-images/`. This is a rough brief, not a rigid spec — some decisions are deliberately left open (marked "OPEN" below and in the PRD) for you to make and justify. Once you've reviewed everything and made those calls, **update this CLAUDE.md yourself** — fill in the OPEN items with your actual decisions (styling approach, folder structure, libraries chosen, ServiceNow client approach, etc.) so this file reflects the real project going forward, not the pre-build brief. Then give me a short summary of what you understood and what you decided before writing app code.

## Tech stack

- **Frontend:** React (JavaScript) — fixed
- **Backend:** FastAPI (Python) — fixed
- **Styling approach:** Tailwind CSS — utility-first, fastest way to hand-build a custom dark design-token system (colors, spacing, type scale) for a design-heavy build without fighting a component library's defaults.
- **State management:** React local state + Context only (e.g. a small `AuthContext` for the mock session flag). No Redux/Zustand — nothing in this phase warrants it.
- **Excel export:** `xlsx` (SheetJS), client-side, generated from the currently filtered ticket set.
- **Icons:** `lucide-react` — clean single-weight line icons, consistent with the enterprise dark aesthetic in the reference images, tree-shakeable.
- **Frontend build tool:** Vite + React Router — standard, fast pairing for a JS React SPA.
- **Ticket store:** DynamoDB (`boto3`), sole source of truth. The backend never calls ServiceNow or any other ITSM tool directly — see "What this is" above and "Ticket data (DynamoDB, in scope this phase)" below.
- **Agentic layer:** superseded — the agent itself (`dtp_agent`, Strands Agents SDK) lives in its own separate repo, not built here. What *is* built here is the connection to it: `WS /ws/agent` (browser↔backend) plus real `local`/`agentcore` client adapters (backend↔dtp_agent), config-switchable, with a canned-response fallback. See `docs/AI_AGENT_INTEGRATION.md`.

## Design system

Enterprise-grade (Deloitte-facing) — must look high-end and considered, not templated. Reference screenshots are in `docs/reference-images/` — study `tickets-page.png` and `ai-agent-chat.png` closely before building any page.

- **Theme:** unified across the whole app now, Login included — **white/near-white content + a true-black sidebar/brand panel (`#0A0A0A`) + green brand accent** (`#86BC25`, hover `#71A31F`), per a Deloitte-style reference (`docs/reference-images/delo_color_template.png`). This superseded an earlier "recolor everything except Login" decision — the user later asked for Login to get the same black/white/green treatment too, so it no longer keeps the original dark/indigo look. The original all-dark, indigo (`#5B5FEF`) token set (`--color-bg-*`, `--color-accent*`, `--color-border*`, the dark variants of `--color-priority-*`/`--color-status-*`/`--color-sla-*`) has been removed from `frontend/src/index.css` entirely since nothing references it anymore — only `--color-text-primary/secondary/muted` survive from that set, now repurposed as the text scale for content on the dark sidebar/brand panel.
- **Status colors:** Critical/red, High/amber-orange, Medium/yellow, Resolved/green — pill badges, solid pastel-bg/saturated-text pairs for contrast on the white content area (`--color-pill-*` tokens).
- **Typography:** clean sans-serif (Inter or system-ui), generous letter-spacing on labels/eyebrows, uppercase small text for table headers
- **Layout:** persistent left sidebar nav — **Tickets, AI Agent, Settings** (Tickets is the landing page at `/`; no separate Dashboard nav item — the PRD's "Tickets/Dashboard page" is one page, reachable at `/`). Top bar per page (title + primary action button top-right).
- **In-app wordmark:** "L1 Dispatcher" (sidebar logo text + browser tab title) — the project's working title in this file stays "Agentic Support Portal," that's just the UI brand name.
- **Sidebar System Status widget:** Database + AI Agent (renamed from "ServiceNow" once the backend stopped calling ServiceNow directly — the dot now reflects whether `DYNAMODB_TABLE_NAME` is configured, not a live connectivity check; dropped UiPath Orch. entirely — not part of this phase's integrations, so a mocked dot for it added noise without adding signal).
- **Deloitte logo:** real logo file at `frontend/public/del_logo.png`, referenced by absolute path (`/del_logo.png`, not a bundled import) so a missing/renamed file 404s quietly instead of breaking the build. Shown in the Sidebar header and on both panels of the Login screen.
- **Density:** data-dense tables without feeling cramped — match row height/padding style in `tickets-page.png`
- Don't reach for generic Bootstrap/Material defaults — this needs to look custom. Real spacing system, considered type scale, no default blue links.

## Pages (see docs/PRD.md for full detail)

1. **Login** — static only, no real DB yet. **Register has been removed for now** (deliberate scope cut, not an oversight — `RegisterPage.jsx` and its route are deleted; re-add if asked later). Visual direction: two-panel *structure* from `login.png` (black brand panel with the Deloitte logo + form panel), reskinned into the app's unified black/white/green theme rather than `register.png`'s light/green template look (generic stock art, not real brand direction) or the original all-dark/indigo look. Login validates against one hardcoded demo credential — **username `temp` / password `temp`** — with an inline error on mismatch, so there's real success/failure behavior to demo. The username field is a plain string, not email-validated (no email format implied since there's no real account system).
2. **Tickets / Dashboard page** — real tickets read from DynamoDB via the FastAPI backend (this phase — see "Ticket data" below), columns straight off the DB schema: `ticket_id, short_description, priority, state, category, assigned_to, resolution_sla (+ has_resolution_sla_breach), created_at`. Clicking a ticket ID: if `source_system` is in the recognized-platform allowlist, opens the real ticket URL in a new tab; otherwise opens an in-app drawer/form that PATCHes the backend — editable fields are `short_description, description, category, sub_category, team_id, assigned_to, urgency, impact, state, opened_by, opened_for, working_notes`, with `priority` shown as a locked/opaque field derived live from Impact × Urgency (never directly editable) and Category→Sub-category→Team ID→Assigned-to as cascading dropdowns backed by real reference tables (see "Ticket data" below). Per-row action dropdown: "Send reminder email" / "Escalate" (still mocked). Search bar, status filter, priority filter — both filters' options are derived from whatever values are actually present in the loaded tickets, not hardcoded, since we don't control the DB's enum casing/values. Export to Excel.
3. **AI Agent page** — **now a real chat UI wired to a live (or gracefully-degraded) agent**, superseding the original "stays fully mock" plan. Connects to `dtp_agent`, a separate Strands Agents / Bedrock AgentCore Runtime application in its own repo (not part of this codebase — never imported, always called as an external service). Full architecture, config modes, and wire contracts: **`docs/AI_AGENT_INTEGRATION.md`**. Short version: browser talks to our backend over `WS /ws/agent`; our backend talks to `dtp_agent` over plain HTTP locally (`AGENT_MODE=local`, `dtp_agent`'s `app.run()` dev server) or via `boto3` `bedrock-agentcore.invoke_agent_runtime` once deployed (`AGENT_MODE=agentcore`) — both client implementations are real and built now, not deferred, so going from local to deployed is a `.env` change only. Falls back to a canned placeholder response on any failure (agent not running, not configured, error), same philosophy as the ticket/reference-data fallbacks. `boto3` needed upgrading from `1.35.99` to `1.42.97` — the version already in this project's `requirements.txt` predated AWS adding the `bedrock-agentcore` client entirely.

## Ticket data (DynamoDB, in scope this phase)

DynamoDB is the sole source of truth for tickets. We don't ingest, sync, or poll any ITSM tool from this codebase — whatever's in the table is what the UI shows. Real DynamoDB table schema (PK `ticket_id`):

```
ticket_id, assigned_to, assignment_duration, assignment_sla, category, closed_at, created_at,
description, has_assignment_sla_breach, has_resolution_sla_breach, opened_by, opened_for,
priority, resolution_duration, resolution_sla, short_description, source_system, state,
sub_category, team_id, updated_at, urgency, url, working_notes
```

- `GET /api/tickets` / `GET /api/tickets/{ticket_id}` read directly from DynamoDB via `app/store/ticket_repository.py`. `PATCH /api/tickets/{ticket_id}` is a **real write-through to DynamoDB** (`update_item`, not a local-only change). `updated_at` is always bumped server-side to "now" on any successful patch. Enforced server-side in `ticket_service.update_ticket` (403 on an `external_redirect` ticket, 400 on an unknown field), not just hidden in the UI.
- **Editable set, current (`app/domain/ticket.py::EDITABLE_FIELDS`):** `short_description, description, category, sub_category, urgency, impact, state, assigned_to, opened_by, opened_for, team_id, working_notes`. Explicitly **not** editable: `ticket_id` (PK), `created_at`/`updated_at`/`closed_at` (backend-owned), `source_system`/`url` (hidden from the edit form entirely — they drive `management_mode`, not user-facing), `priority` (derived, see below), and the SLA/duration/breach fields (display-only, so an L2 edit can't fake SLA compliance).
- **`impact` is a new field, not in the original real schema** — added because Priority needs it. Existing real tickets show it blank until edited (pydantic default `""`); nothing breaks reading items that don't have the attribute at all.
- **Priority is derived, not directly editable:** `app/domain/priority_matrix.py::compute_priority(impact, urgency)` implements the standard ServiceNow default 3×3 matrix (High/Medium/Low × High/Medium/Low → `"1 - Critical"` … `"5 - Planning"`). `ticket_service.update_ticket` recomputes and overwrites `priority` server-side whenever `impact` or `urgency` is part of the patch — the client can never set `priority` directly (not in `TicketPatch`/`EDITABLE_FIELDS`). The frontend (`utils/priorityMatrix.js`) mirrors the same table for an instant preview in the drawer, but the backend's copy is authoritative. Note: existing real priorities use ServiceNow's own format (e.g. `"P4-Low"`); once impact/urgency are edited, the format changes to the matrix's `"4 - Low"` style — a known cosmetic inconsistency between untouched and edited tickets, not a bug.
- **Cascading dropdowns, backed by two new real reference tables** (categorization matrix + roster — see next bullet): the drawer's Category/Sub-category/Team ID/Assigned-to fields are `<select>`s whose *options* narrow as you go — Category filters Sub-category options to matching matrix rows; Category+Sub-category filters Team ID options; Team ID filters Assigned-to options to that team's roster. **Changing an upstream field resets every downstream field to an explicit "Choose below" placeholder (`""`) rather than auto-picking the first option** (`TicketDetailDrawer.jsx::handleCategoryChange`/`handleSubCategoryChange`/`handleTeamIdChange`) — deliberate: auto-selecting looked like a system recommendation it wasn't. `handleSave` refuses to submit while sub-category/team/assignee are still unset, so a category change can't silently save blank fields if you forget to reselect them. Urgency/Impact/State are fixed-option dropdowns (High/Medium/Low; New/In Progress/On Hold/Resolved/Closed/Canceled — no `on_hold_reason` sub-field for now, deliberately skipped). Every dropdown's option list is still unioned with the ticket's *current* value even if that value isn't in the reference data, so loading an existing ticket never silently discards a value it doesn't recognize.
- **New reference tables — real, not derived from ticket data:** `CATEGORIZATION_MATRIX_TABLE_NAME` (schema: `issue_id` PK, `category_name`, `sub_category_name`, `team_id`, `impact`, `urgency`, `issue`, `issue_type`, `active`, …) and `ROSTER_TABLE_NAME` (schema: `UID` PK, `employee_id`, `emp_id`, `employee_name`, `team_id`, `team_name`, `active`, …), both in `.env`/`.env.example`. Read-only endpoints `GET /api/reference/categorization-matrix` / `GET /api/reference/roster` (`app/routes/reference.py` → `reference_service.py` → `reference_repository.py`), same mock-fallback philosophy as the main Tickets table (`app/mock_reference_data.py`), filtered to `active` rows in the service layer. This **replaced** an earlier, simpler approach where the assignee dropdown was derived client-side from `assigned_to` values already seen across loaded tickets — that approach is gone now that real roster/matrix tables exist.
- **If dropdown values look wrong/unexpected (e.g. a category that isn't in your real table), check `source`/`reason` on the reference endpoints before assuming a bug** — `GET /api/reference/categorization-matrix` and `/roster` report `{source: "mock"|"dynamodb", reason: "not_configured"|"connection_error"|null}` exactly like the main Tickets endpoint. `CATEGORIZATION_MATRIX_TABLE_NAME`/`ROSTER_TABLE_NAME` being unset in `.env` is not itself a bug — it's the same intentional mock-fallback path as everywhere else in this app — but it does mean the dropdowns show `app/mock_reference_data.py`'s made-up categories (including "Schedule", which isn't in any real table), not your real categorization/roster data, until those two env vars are set. Confirmed real once set: 50 real categorization rows / 13 real categories, 28 real roster entries / 10 real teams.
- **The real tables' `active` field is the string `"Yes"`, not a boolean** — `reference_service._is_active()` originally only recognized `True`/`"true"`/`1`/`"1"`, which silently filtered out every real row (0 items returned, even though `source: dynamodb` with no error — a real bug, not the not-configured/mock case). Fixed to normalize case/whitespace against both truthy (`true`/`yes`/`y`/`1`/`active`) and falsy (`false`/`no`/`n`/`0`/`inactive`) string forms, defaulting to **shown** for anything unrecognized rather than silently hiding real reference data over a formatting mismatch.
- **`app/store/dynamo.py::get_table(table_name)` takes an explicit table name now** (was hardcoded to the Tickets table) — needed once a second and third table existed. `ticket_repository.py` has its own `_table()` wrapper passing `settings.dynamodb_table_name`.
- **Incident, for the record:** while testing the priority-matrix change against a real ticket, PATCHing `impact`/`urgency` back to "revert" it also silently recomputed and overwrote `priority` (since priority is now always server-derived whenever those fields are touched) — there is no API path to set `priority` back directly. Had to fix the real DynamoDB item with a one-off boto3 script outside the normal app code path. Lesson: don't test writes against real production tickets once derived/computed fields are involved — use the mock fallback path instead.
- **Redirect vs. edit rule — explicit source_system allowlist:** `app/domain/ticket.py::VALID_REDIRECT_SOURCE_SYSTEMS` is a case-insensitive set of recognized platform values; `source_system` in that set → `management_mode: "external_redirect"` (ticket ID links to `url` in a new tab, not editable through us); anything else → `"internal_edit"` (opens our drawer/form). Plain derived property on `TicketRecord`, not stored. Real table's `source_system` values turned out to be `Chatbot`/`Email`/`Phone`/`Self-Service Portal`/`ServiceNow Portal` — the ticket's **intake channel**, not "which platform" — and every row has a real ITSM `url` regardless of channel. We went through a couple of iterations on this: url-presence-based (redirects everything, since every row has a url) → explicit allowlist with exactly `"servicenow"` (matches nothing real, since the actual value is `"ServiceNow Portal"`) → current: allowlist includes both `"servicenow"` and `"servicenow portal"`, so the 68 real `ServiceNow Portal` tickets redirect and the other 427 (Chatbot/Email/Phone/Self-Service Portal) stay editable in our UI even though they also carry a url. Extend the set as more platforms are recognized.
- Credentials: `Settings` models `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` explicitly (read from `.env`, passed straight into the `boto3.resource()` call in `app/store/dynamo.py`) — **do not** rely on "boto3 picks .env vars up automatically," it doesn't: `pydantic-settings` parses `.env` into its own `Settings` object only, it never copies values into the real process environment, so anything not declared as a `Settings` field (like AWS creds used to be) is silently invisible to boto3's own credential chain. This was a real bug that caused every DynamoDB call to fail with `Unable to locate credentials` even with valid keys in `.env`. Leave both blank to fall back to boto3's own chain (shared `~/.aws/credentials` / instance role) instead. `AWS_REGION=` present-but-blank must not beat the `us-east-1` default — handled via `Settings.resolved_aws_region`, not the raw field.
- **Fallback:** if `DYNAMODB_TABLE_NAME` is unset, or any DynamoDB call fails (including `update_item`, so edits don't silently 500 when AWS creds aren't available locally), fall back to an in-memory mock dataset (`app/mock_data.py`) so the app stays demoable. The mock store is mutable in-process, so edits made while running mock-only still stick until restart.
- **Loosely-typed fields:** `created_at`/`updated_at`/`closed_at`/the SLA & duration fields are modeled as plain strings, not parsed dates/numbers — we don't control their real format from whatever ingests the table, and over-fitting the schema caused a real bug once already (see git history). Display them as-is; use the `has_*_sla_breach` booleans for color coding rather than computing our own countdown.
- **Priority/status badge colors & filter options:** matched case-insensitively against known labels (frontend `Badge.jsx`) with a neutral fallback tone for anything unrecognized; the Tickets page's status-tab and priority-filter option lists are derived from whatever values are actually present in the loaded tickets (not hardcoded), for the same reason.

## Folder structure

```
L1_dispatcher/
  frontend/   Vite React app —
                src/pages/TicketsPage.jsx, LoginPage.jsx, AIAgentPage.jsx, SettingsPage.jsx
                src/components/tickets/TicketDetailDrawer.jsx, Badge.jsx, SlaCell.jsx, RowActionsMenu.jsx, ToastStack.jsx
                src/services/ticketsService.js, referenceService.js, healthService.js, apiClient.js
                src/utils/priorityMatrix.js     mirrors backend's Impact x Urgency -> Priority table (preview only)
                src/context, src/components/layout, src/components/auth, src/components/routing
  backend/    FastAPI app —
                app/main.py, app/config.py, app/mock_data.py, app/mock_reference_data.py,
                app/dynamo_utils.py, .env.example
                app/domain/ticket.py            canonical TicketRecord, EDITABLE_FIELDS, VALID_REDIRECT_SOURCE_SYSTEMS
                app/domain/priority_matrix.py   compute_priority(impact, urgency) — authoritative, server-side
                app/store/dynamo.py             boto3 table wrapper, get_table(table_name)
                app/store/ticket_repository.py  get_all/get/update_fields, DynamoDB<->mock fallback
                app/store/reference_repository.py  categorization-matrix/roster reads, same fallback pattern
                app/services/ticket_service.py  route-facing orchestration, edit enforcement, priority recompute
                app/services/reference_service.py  active-row filtering for reference data
                app/routes/tickets.py           GET/GET/PATCH /api/tickets
                app/routes/reference.py         GET /api/reference/categorization-matrix, /roster
                app/routes/agent_ws.py          WS /ws/agent, GET /api/agent/health
                app/services/agent_service.py   AGENT_MODE switch + canned-response fallback
                app/integrations/agent_client_local.py, agent_client_agentcore.py
  docs/       PRD + reference images (existing) + AI_AGENT_INTEGRATION.md
  CLAUDE.md
```

## Data layer conventions

- Frontend: keep API calls behind a thin service layer (`/src/services/ticketsService.js` etc.) — components should not call `fetch` directly.
- Backend: the route layer (`app/routes/tickets.py`) never talks to DynamoDB or boto3 directly — it only calls `app/services/ticket_service.py`, which calls `app/store/ticket_repository.py`, which is the only module that decides real-DynamoDB-vs-mock.

## Non-goals right now

- No real auth/DB (login stays static; Register removed for now)
- No real execution of reminder/escalate actions (display + mock confirmation only)
- No production deployment concerns
- `dtp_agent` isn't deployed to Bedrock AgentCore Runtime yet — `AGENT_MODE=local` is the default; the `agentcore` path is built and real (see `docs/AI_AGENT_INTEGRATION.md`) but unverifiable until an `AGENTCORE_RUNTIME_ARN` exists

## Working style

- Build in phases: (1) review brief + finalize OPEN decisions + update this file, (2) project scaffold (frontend + FastAPI) + design tokens/theme, (3) login/register static, (4) FastAPI ServiceNow integration + tickets/dashboard page wired to it, (5) AI agent page (static), (6) polish/export. Confirm each phase with me before moving to the next.
- Ask me before introducing a new major dependency.
- If ServiceNow credentials aren't provided yet, say so explicitly and proceed with the mock-fallback path rather than blocking.
