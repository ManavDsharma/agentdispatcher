# Product Requirements Document

## Agentic Support Portal — Phase 1 (Frontend + ServiceNow-integrated Backend)

**Status:** This is a rough brief, not a locked spec. Where a decision is marked **OPEN**, make the call yourself, note it in `CLAUDE.md`, and proceed — don't block on it. Fixed constraints: **React (frontend)** and **FastAPI (backend)**. Everything else (styling approach, state management, exact folder structure, specific libraries) is yours to decide based on what best fits this build.

**Reference visuals:** `docs/reference-images/tickets-page.png`, `ai-agent-chat.png`, `login.png`, `register.png`

---

## 1. Goal

Build a professional, enterprise-grade (Deloitte-facing) internal support portal with three functional surfaces:

1. Login / Register (static)
2. Tickets / Dashboard — **real tickets fetched from a real ServiceNow instance** via our own FastAPI backend
3. AI Agent (chat interface, static/mock responses)

The agentic/LangGraph layer behind the AI Agent page is a later phase. ServiceNow integration for ticket retrieval is **in scope now**.

---

## 2. Tech Stack

- **Frontend:** React (JavaScript), React Router for navigation — fixed
- **Backend:** FastAPI (Python) — fixed
- **Styling:** OPEN — choose the approach best suited to building a polished, custom dark UI quickly (e.g. Tailwind, CSS Modules, styled-components). State and justify the choice.
- **State:** OPEN — default to React local state/Context; don't add a state library unless there's a real need.
- **Excel export:** client-side generation (e.g. SheetJS `xlsx`) — OPEN if something better fits.
- **Icons:** OPEN — one consistent set across the app.
- **ServiceNow access:** FastAPI backend calls the ServiceNow Table API server-side (e.g. via `httpx` or `requests`) — OPEN on exact client library/pattern, not OPEN on "backend does it, not frontend."
- **Backend (future phase, not now):** LangGraph-based agent orchestration behind the AI Agent page.

---

## 3. Global Layout

Persistent app shell used on every authenticated page:

- **Left sidebar nav**, fixed width, dark background:
  - Logo/wordmark at top
  - Nav items: Dashboard, AI Agent, Tickets, Settings (icon + label)
  - Active item highlighted (indigo accent background/left border)
  - User profile block pinned to bottom (avatar initials, name, maybe role)
- **Top bar** per page: page title/eyebrow + primary action button aligned right
- **Connection/system status** indicator (sidebar footer or page-level) — for this phase, the ServiceNow status dot should reflect the **real** connection state of the backend integration (connected/error), not purely cosmetic; UiPath Orch. and AI Agent dots remain mocked

---

## 4. Page 1 — Login / Register

### 4.1 Purpose

Static gate before entering the app. No real authentication/DB yet.

### 4.2 Login

**Fields:** Email ID, Password, "Login" button, link to Register.

**Behavior (mocked):**

- Accept any non-empty input, or validate against a single hardcoded demo credential — your call
- On success → route to Tickets/Dashboard, persist a mock "logged in" flag for the session
- On failure (if hardcoded validation used) → inline error, no page reload

### 4.3 Register

**Fields:** Name, Email, Password, Confirm Password, "Register" button, link to Login.

**Behavior (mocked):**

- Client-side validation only (required fields, password match, basic email format)
- On submit → success state → route to Login (no account actually persisted)

### 4.4 Visual direction

Reference shows a two-panel layout: dark brand panel + light form panel (`login.png`), light centered form for register (`register.png`). **OPEN:** keep that light/dark split-panel contrast, or adapt fully into the app's dark theme for consistency — pick one direction and apply it to both pages consistently.

---

## 5. Page 2 — Tickets / Dashboard

### 5.1 Purpose

Primary working surface. Displays **real incidents from a connected ServiceNow instance**, fetched via our FastAPI backend and remapped into a cleaner, action-oriented table.

### 5.2 Field mapping (ServiceNow → our UI)

| ServiceNow field     | Our field                                                                | Notes                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Number               | Ticket ID                                                                | e.g. `INC0012850`, links out to the real ServiceNow incident                                                                                                                                                |
| Short description    | Title                                                                    | truncate with ellipsis if long                                                                                                                                                                              |
| Priority             | Priority                                                                 | Critical / High / Medium / Low — colored pill                                                                                                                                                               |
| State                | Status                                                                   | Open / In Progress / Pending Approval / Resolved — colored pill (map ServiceNow's numeric/state values to these labels in the backend mapping layer)                                                        |
| Category             | Category                                                                 | e.g. Bot Failure, Schedule, Asset, Deployment, Access, Performance                                                                                                                                          |
| Assigned to          | Assignee                                                                 | name, or "Unassigned"                                                                                                                                                                                       |
| — (derived)          | SLA                                                                      | time-remaining display, color-coded by urgency (red <1hr, amber <2hr, neutral otherwise); derive from ServiceNow SLA fields if available, otherwise a reasonable placeholder — flag which approach was used |
| Opened               | Created                                                                  | timestamp                                                                                                                                                                                                   |
| Updated / Updated by | _(not shown as columns — intentionally omitted from this phase's table)_ |

We are intentionally not mirroring ServiceNow's raw field set 1:1 — this is a curated, ops-friendly view.

### 5.3 Backend: ServiceNow integration (real, this phase)

- **Endpoint:** `GET /api/tickets` (naming OPEN) on the FastAPI backend, called by the frontend instead of ServiceNow directly.
- **Auth to ServiceNow:** basic auth (username/password) to start, read from environment variables — never hardcoded, never exposed to the frontend. Provide `.env.example` with the expected variable names (e.g. `SERVICENOW_INSTANCE_URL`, `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`).
- **Data source:** ServiceNow Table API, `incident` table, with reasonable query params (e.g. limit, ordered by most recent) — OPEN on exact query shape.
- **Mapping:** isolate ServiceNow → our-shape mapping in one backend module/function so it's easy to adjust field mapping later without touching route logic.
- **Fallback:** if `SERVICENOW_*` env vars are missing/unset, or the ServiceNow call fails, fall back to mock data so the frontend stays demoable — but this must be a genuine fallback path in otherwise-real integration code, not the only path that exists.
- **Frontend:** never calls ServiceNow directly; always goes through our own backend endpoint.

### 5.4 Table header controls

- **Tabs/counts** above the table: `All`, `Open`, `In Progress`, `Pending Approval`, `Resolved` — live counts from the currently loaded (real or fallback) dataset; clicking filters the table
- **Search bar**: full-width, searches across Ticket ID, Title, and Assignee (client-side filter over loaded data); placeholder: "Search by ID, title, assignee..."
- **Priority filter dropdown**: All Priorities / Critical / High / Medium / Low, combinable with status tab + search
- **"+ New Ticket" button** top-right — no-op/disabled/stub for now, not core to this phase

### 5.5 Table columns (final order)

`Ticket ID | Title | Priority | Status | Category | Assignee | SLA | Created`

### 5.6 Row interactions

- **Ticket ID**: styled as a link (accent color); hover shows pointer + underline; click opens the real ServiceNow incident in a new tab using the real instance URL and the ticket's `sys_id`, e.g. `{SERVICENOW_INSTANCE_URL}/nav_to.do?uri=incident.do?sys_id={sys_id}`
- **Row-level action dropdown** ("Actions ▾" or kebab menu) with exactly two options — **these stay mocked this phase**, only ticket retrieval is real:
  - **Send reminder email** — on click, show a toast/confirmation and console.log the intended payload. No real email sent.
  - **Escalate** — confirmation toast + console.log; consider a confirm step since escalation is a meaningful action even mocked.

### 5.7 Export

- **"Export to Excel"** button, exports the currently filtered/visible ticket set to a real `.xlsx` (client-side), columns matching the on-screen table.
- Filename pattern: `tickets-export-{YYYY-MM-DD}.xlsx`

### 5.8 Loading / empty / error states

- **Loading:** skeleton rows or spinner while the backend call is in flight
- **Empty:** friendly empty-state message if no tickets match filters/search
- **Error:** if the backend ServiceNow call fails and no fallback is configured, show a clear error banner at the top of the table (not a silent blank page) — this is a real state now, not a reserved-for-later one

---

## 6. Page 3 — AI Agent

### 6.1 Purpose

Static chat interface previewing the eventual agent experience. Fully mock this phase — no real LLM/backend call.

### 6.2 Layout (per `ai-agent-chat.png`)

- **Header:** agent avatar/icon, "AI Support Agent" title, connection status subtitle (mocked), model badge top-right (e.g. "Azure GPT-4o"), refresh/reset icon
- **Message thread:** system/agent intro message on load listing capabilities as bullets (bot failure diagnosis, asset management, schedule control, job management, information queries) with example phrasing per capability
- **Suggested prompt chips** below intro (e.g. "List all running bots", "Why did the last bot fail?", "Show pending schedules", "List Orchestrator assets") — clicking one sends that message
- **Input bar** pinned to bottom: text input + send button; placeholder reflects connection state
- **Sidebar status widget**: mini status list — UiPath Orch. / ServiceNow / AI Agent — each with a colored dot (ServiceNow dot may reflect real backend status per §3; others mocked)

### 6.3 Mock behavior

- User message → right-aligned in thread
- Agent responds after a short simulated delay (typing indicator optional) with a canned/keyword-matched response, or a generic "live agent logic coming in a later phase" fallback
- No persistence needed across reloads

---

## 7. Backend Structure (new this revision)

Since FastAPI is now doing real work, keep it organized from the start:

- `app/main.py` — app entrypoint, route registration
- `app/routes/tickets.py` — `/api/tickets` route(s)
- `app/integrations/servicenow.py` — ServiceNow client + auth + raw fetch
- `app/mapping/ticket_mapper.py` (or similar) — ServiceNow → our ticket shape
- `app/config.py` — env var loading (instance URL, credentials)
- `.env.example` — documents required env vars without real secrets
- CORS configured to allow the frontend dev origin

Exact structure/naming is OPEN — this is a reasonable default, adjust as needed.

---

## 8. Mock Data (fallback only, not primary this phase)

Keep a mock ticket dataset (~10–15 tickets, `INC00128xx` range) covering all status/priority/category combinations, matching §5.2 — used only when real ServiceNow data isn't available (missing credentials or failed call), so the app is always demoable.

---

## 9. Explicitly Out of Scope (this phase)

- Real authentication/DB-backed accounts (login/register stay static)
- Real LLM/agent behind the chat page
- Real email sending / real escalation execution
- Backend deployment, production environment configs
- LangGraph/agentic orchestration layer

---

## 10. Acceptance Criteria (Phase 1 "done")

- [ ] Login/Register pages functional against mock rules, route correctly
- [ ] FastAPI backend has a working `/api/tickets` endpoint that authenticates to a real ServiceNow instance and returns mapped ticket data, with a clean fallback to mock data when credentials/connection aren't available
- [ ] Tickets page renders backend-sourced data with correct field mapping; search, status filter, and priority filter all work together (AND logic); tab counts are accurate and live
- [ ] Ticket ID links open the real ServiceNow incident in a new tab using the real instance URL pattern
- [ ] Row action dropdown supports Reminder + Escalate with visible mock confirmation feedback
- [ ] Export to Excel produces a valid `.xlsx` reflecting the current filtered view
- [ ] AI Agent page visually matches reference, supports basic send/receive with canned responses
- [ ] Loading/empty/error states are handled on the Tickets page, including a real error state for ServiceNow connection failure
- [ ] Design is visually consistent across all pages (shared color tokens, spacing, typography)
- [ ] App shell (sidebar/topbar) shared across Dashboard, Tickets, AI Agent, Settings
- [ ] `CLAUDE.md` has been updated by Claude Code itself with the finalized OPEN decisions before/while building
