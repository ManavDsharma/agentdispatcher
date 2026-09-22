# Project: Agentic Support Portal

## What this is

A support-ops web app, conceptually similar to an L1-assistant we've built before, but standalone. This phase covers the **frontend + a real FastAPI backend for ServiceNow integration**. The agentic/LangGraph layer behind the AI Agent page is a _later_ phase — for now that page stays static/mock.

## Update — pivot to Compliance Workspace Issues (sn_grc_issue)

The original build pulled `incident` records for the Tickets page. That was **fully replaced** with ServiceNow's Compliance Workspace Issues (table `sn_grc_issue`, reached via All → Compliance Workspace → Issues → All Issues → Create an Issue) — `incident` is no longer used anywhere. A new **Create Issue** page/nav item was added, wired to a real `POST` against `sn_grc_issue`. Login/Register were also removed entirely (there was never real auth behind them, and the gate added friction without adding anything real) — the app now opens straight to Tickets. See `docs/GRC_ISSUE_INTEGRATION.md` for the full field contract, how it was reverse-engineered, and what's still open. The rest of this file has been updated in place to reflect this; sections describing Login/Register/`incident` below are historical unless noted otherwise.

## First step, before writing any code

Read this file fully, then read `docs/PRD.md`, then look at every image in `docs/reference-images/`. This is a rough brief, not a rigid spec — some decisions are deliberately left open (marked "OPEN" below and in the PRD) for you to make and justify. Once you've reviewed everything and made those calls, **update this CLAUDE.md yourself** — fill in the OPEN items with your actual decisions (styling approach, folder structure, libraries chosen, ServiceNow client approach, etc.) so this file reflects the real project going forward, not the pre-build brief. Then give me a short summary of what you understood and what you decided before writing app code.

## Tech stack

- **Frontend:** React (JavaScript) — fixed
- **Backend:** FastAPI (Python) — fixed
- **Styling approach:** Tailwind CSS — utility-first, fastest way to hand-build a custom dark design-token system (colors, spacing, type scale) for a design-heavy build without fighting a component library's defaults.
- **State management:** React local state only. No Redux/Zustand, no auth context — there's no real auth in this app (see pivot note above).
- **Excel export:** `xlsx` (SheetJS), client-side, generated from the currently filtered issue set. *(Chosen but not yet implemented — no export button exists on the Tickets page yet; still open.)*
- **Icons:** `lucide-react` — clean single-weight line icons, consistent with the enterprise dark aesthetic in the reference images, tree-shakeable.
- **Frontend build tool:** Vite + React Router — standard, fast pairing for a JS React SPA.
- **ServiceNow client:** FastAPI backend uses `httpx` (async) with basic auth against the ServiceNow Table API — **`sn_grc_issue`** (Compliance Workspace Issues), not `incident`. Isolated entirely in `app/integrations/servicenow.py`; credentials never leave the backend. Also fetches `sn_grc_issue_rating` live (a reference table, not a static choice list) for the Create Issue form's Issue Rating dropdown.
- **Agentic layer (LangGraph etc.):** not part of this phase — do not build it yet, just don't architect anything that would block adding it later.

## Design system

Enterprise-grade (Deloitte-facing) — must look high-end and considered, not templated. Reference screenshots are in `docs/reference-images/` — study `tickets-page.png` and `ai-agent-chat.png` closely before building any page.

- **Theme (revised):** the app shell (Tickets, AI Agent, Settings) is now **white/near-white content + a dark near-black sidebar (`#0B0E14`–`#12151C`, unchanged) + green brand accent** (`#86BC25`, hover `#71A31F`), per a Deloitte-style reference (`docs/reference-images/delo_color_template.png`) — replaces the original all-dark/indigo direction below for everything except Login/Register. **Login/Register intentionally keep the original all-dark, indigo (`#5B5FEF`) treatment** — the user asked for the recolor "apart from the login page," so the two auth pages are a deliberate exception, not an oversight. New tokens added in `frontend/src/index.css` (`--color-brand*`, `--color-surface*`, `--color-ink*`, `--color-pill-*`, `--color-urgency-*`) live alongside the original dark-mode tokens rather than replacing them, so Login/Register/FormField keep working unmodified off the originals below.
- **Original theme (still used by Login/Register only):** dark mode, near-black backgrounds (`#0B0E14`–`#12151C` range), not pure black; indigo/violet accent (~`#5B5FEF`) for primary actions.
- **Status colors:** Critical/red, High/amber-orange, Medium/yellow, Resolved/green — pill badges. On the new light app shell these are solid pastel-bg/saturated-text pairs for contrast (`--color-pill-*` tokens); the original soft-tinted-on-dark versions (`--color-priority-*`/`--color-status-*`) remain for anything still on the dark theme.
- **Typography:** clean sans-serif (Inter or system-ui), generous letter-spacing on labels/eyebrows, uppercase small text for table headers
- **Layout:** persistent left sidebar nav — **Tickets, AI Agent, Settings** (Tickets is the landing page at `/`; no separate Dashboard nav item — the PRD's "Tickets/Dashboard page" is one page, reachable at `/`). Top bar per page (title + primary action button top-right).
- **In-app wordmark:** "L1 Dispatcher" (sidebar logo text + browser tab title) — the project's working title in this file stays "Agentic Support Portal," that's just the UI brand name.
- **Sidebar System Status widget:** ServiceNow + AI Agent only (dropped UiPath Orch. — not part of this phase's integrations, so a mocked dot for it added noise without adding signal).
- **Density:** data-dense tables without feeling cramped — match row height/padding style in `tickets-page.png`
- Don't reach for generic Bootstrap/Material defaults — this needs to look custom. Real spacing system, considered type scale, no default blue links.

## Pages (see docs/PRD.md for full detail — historical; superseded for Tickets/Create Issue by the pivot)

1. ~~**Login / Register**~~ — removed. There was no real auth behind these (one hardcoded demo credential), so the gate was dropped and the app now opens straight to Tickets at `/`.
2. **Tickets page** — real issues pulled from ServiceNow's `sn_grc_issue` (Compliance Workspace) via the FastAPI backend, displayed with our remapped field set: `issue id, title, priority, status, category, assignee, SLA, created`. Issue ID links out to the real ServiceNow issue URL. Status tabs and priority filter use the real `sn_grc_issue` scales (New/Analyze/Respond/Review/Closed Complete/Closed Incomplete; Critical/High/Moderate/Low/Planning). Per-row action dropdown: "Send reminder email" / "Escalate" (still mocked — only issue _fetching_ is real). Search bar, status filter, priority filter. Export to Excel — chosen but not yet implemented.
3. **Create Issue page** (`/issues/new`, sidebar nav item) — real form posting to `sn_grc_issue`. Six fields, matching the actual Compliance Workspace Create Issue form: Observation Heading (`short_description`, the only ServiceNow-enforced-mandatory field), Observation Category (`issue_type`), Classification (`classification`), Priority (`priority`), Issue Rating (`issue_rating` — a reference field to `sn_grc_issue_rating`, fetched live, never hardcoded), Observation Description (`description`). On success, shows the created issue number (and a link, if the instance URL is configured). See `docs/GRC_ISSUE_INTEGRATION.md` for the full contract and how each field was confirmed.
4. **AI Agent page** — static chat UI matching `ai-agent-chat.png`. No real LLM call yet — canned/echo responses are fine. This stays fully mock this phase.

## ServiceNow integration (in scope this phase)

- FastAPI backend exposes `GET /api/issues` (list), `GET /api/issues/options` (dropdown data for Create Issue), and `POST /api/issues` (create) — all against `sn_grc_issue` via the ServiceNow Table API (basic auth).
- Credentials read from backend environment variables / `.env` (never hardcoded, never sent to frontend); see `.env.example` for expected vars (`SERVICENOW_INSTANCE_URL`, `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`).
- Frontend calls our own FastAPI endpoints, not ServiceNow directly.
- Row actions (reminder/escalate) remain mocked — only issue retrieval and creation are real.
- Mock-data fallback path (`app/mock_data.py`) keeps the frontend demoable if ServiceNow isn't configured/reachable; the real integration path is always exercised first and is switchable via env config.
- **SLA field decision (unchanged from the `incident` design):** ServiceNow's real SLA tracking lives in the separate `task_sla` table, out of scope for a plain Table API pull. The mapper derives a placeholder SLA countdown server-side from `priority` + `opened_at` (Critical 1hr / High 4hr / Moderate 8hr / Low 24hr / Planning 72hr window minus elapsed time), color-coded per the red/amber/neutral thresholds. Heuristic placeholder, not real ServiceNow SLA data.
- **Data volume decision:** the real `sn_grc_issue` table has ~2,676 records. `GET /api/issues` only pulls the 50 most recent (`ORDERBYDESCopened_at`) — a deliberate choice, not a bug. Search/status/priority filters are client-side over those 50 only, so a search for an older issue can come back empty even though it exists in ServiceNow. Server-side search + pagination would be the correct fix at this table size; explicitly deferred for now. See `docs/GRC_ISSUE_INTEGRATION.md`.
- **Field contract caveat:** `sn_grc_issue`'s dictionary reports every field as non-mandatory — real requiredness is enforced by UI Policy on the Compliance Workspace form, which we didn't have `sys_ui_policy` access to audit directly. The contract was instead confirmed against the live form's own computed field state (mandatory flags, choice lists) captured while creating a real test issue. If the workspace later enforces more fields as mandatory, the Create Issue form/backend validation will need revisiting — see the "Still open" section of `docs/GRC_ISSUE_INTEGRATION.md`.

## Folder structure

```
L1_dispatcher/
  frontend/   Vite React app — src/components, src/pages, src/services
              src/pages/TicketsPage.jsx, src/pages/CreateIssuePage.jsx
              src/services/issuesService.js
  backend/    FastAPI app — app/main.py, app/routes/issues.py, app/integrations/servicenow.py,
              app/mapping/issue_mapper.py, app/mapping/sla.py, app/config.py, app/mock_data.py, .env.example
  docs/       PRD + reference images + GRC_ISSUE_INTEGRATION.md
  CLAUDE.md
```

(`src/context/`, the auth pages/components, and `ticket_mapper.py`/`routes/tickets.py`/`ticketsService.js` were removed in the pivot — no auth context exists anymore, and everything ticket-named was renamed to issue-named.)

## Data layer conventions

- Frontend: keep API calls behind a thin service layer (`src/services/issuesService.js`) — components should not call `fetch` directly.
- Backend: keep ServiceNow-specific logic isolated in its own module (`app/integrations/servicenow.py`) behind a clean function interface (`get_issues()`, `create_issue()`, `get_issue_ratings()`, `map_issue(raw)` etc.), so it's easy to extend or swap later.

## Non-goals right now

- No real auth/DB (login/register were removed rather than kept static — there's nothing gating the app now)
- No real agent/LLM behind the chat page
- No real execution of reminder/escalate actions (display + mock confirmation only)
- No production deployment concerns

## Working style

- Build in phases: (1) review brief + finalize OPEN decisions + update this file, (2) project scaffold (frontend + FastAPI) + design tokens/theme, (3) login/register static, (4) FastAPI ServiceNow integration + tickets/dashboard page wired to it, (5) AI agent page (static), (6) polish/export. Confirm each phase with me before moving to the next.
- Ask me before introducing a new major dependency.
- If ServiceNow credentials aren't provided yet, say so explicitly and proceed with the mock-fallback path rather than blocking.
