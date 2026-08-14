# Project: Agentic Support Portal

## What this is

A support-ops web app, conceptually similar to an L1-assistant we've built before, but standalone. This phase covers the **frontend + a real FastAPI backend for ServiceNow integration**. The agentic/LangGraph layer behind the AI Agent page is a _later_ phase — for now that page stays static/mock.

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
- **ServiceNow client:** FastAPI backend uses `httpx` (async) with basic auth against the ServiceNow Table API (`incident` table). Isolated entirely in `app/integrations/servicenow.py`; credentials never leave the backend.
- **Agentic layer (LangGraph etc.):** not part of this phase — do not build it yet, just don't architect anything that would block adding it later.

## Design system

Enterprise-grade (Deloitte-facing) — must look high-end and considered, not templated. Reference screenshots are in `docs/reference-images/` — study `tickets-page.png` and `ai-agent-chat.png` closely before building any page.

- **Theme:** dark mode, near-black backgrounds (`#0B0E14`–`#12151C` range), not pure black
- **Accent:** indigo/violet (~`#5B5FEF` range) for primary actions and active nav states
- **Status colors:** Critical/red, High/amber-orange, Medium/yellow, Resolved/green — pill-shaped badges with soft-tinted backgrounds, not solid fills
- **Typography:** clean sans-serif (Inter or system-ui), generous letter-spacing on labels/eyebrows, uppercase small text for table headers
- **Layout:** persistent left sidebar nav — **Tickets, AI Agent, Settings** (Tickets is the landing page at `/`; no separate Dashboard nav item — the PRD's "Tickets/Dashboard page" is one page, reachable at `/`). Top bar per page (title + primary action button top-right).
- **In-app wordmark:** "L1 Dispatcher" (sidebar logo text + browser tab title) — the project's working title in this file stays "Agentic Support Portal," that's just the UI brand name.
- **Sidebar System Status widget:** ServiceNow + AI Agent only (dropped UiPath Orch. — not part of this phase's integrations, so a mocked dot for it added noise without adding signal).
- **Density:** data-dense tables without feeling cramped — match row height/padding style in `tickets-page.png`
- Don't reach for generic Bootstrap/Material defaults — this needs to look custom. Real spacing system, considered type scale, no default blue links.

## Pages (see docs/PRD.md for full detail)

1. **Login / Register** — static only, no real DB yet. Visual direction: keep the two-panel *structure* from `login.png` (dark brand panel + form panel), but reskin the form panel fully into the app's dark theme with indigo accents rather than the light/green template look of `register.png` (which reads as generic stock art, not real brand direction). Applied consistently across both pages so the gate pages feel like the same product as the rest of the app. Login validates against one hardcoded demo credential (inline error on mismatch) rather than accepting any input, so there's real success/failure behavior to demo; Register stays client-side-validation-only per the PRD.
2. **Tickets / Dashboard page** — real tickets pulled from a real ServiceNow instance via the FastAPI backend (this phase — see "ServiceNow integration" below), displayed with our remapped field set: `ticket id, title, priority, status, category, assignee, SLA, created`. Ticket ID links out to the real ServiceNow incident URL. Per-row action dropdown: "Send reminder email" / "Escalate" (these actions themselves stay mocked for now — just the _ticket fetching_ is real). Search bar, status filter, priority filter. Export to Excel.
3. **AI Agent page** — static chat UI matching `ai-agent-chat.png`. No real LLM call yet — canned/echo responses are fine. This stays fully mock this phase.

## ServiceNow integration (in scope this phase)

This is a real goal now, not deferred:

- FastAPI backend exposes `GET /api/tickets` that authenticates to a ServiceNow instance (basic auth to start) and pulls incidents via the Table API, mapping ServiceNow fields to our ticket shape (see PRD §5.2 mapping table).
- Credentials should be read from backend environment variables / a `.env` file (never hardcoded, never sent to frontend). Set up a `.env.example` showing the expected vars (`SERVICENOW_INSTANCE_URL`, `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`, etc.).
- Frontend calls our own FastAPI endpoint, not ServiceNow directly.
- Row actions (reminder/escalate) remain mocked in this phase — only ticket _retrieval_ is real.
- If no real ServiceNow instance/credentials are available to test against during build, keep a mock-data fallback path so the frontend remains demoable, but the integration code path should be real and switchable via env config, not fake.
- **SLA field decision:** ServiceNow's real SLA tracking lives in the separate `task_sla` table, which is out of scope for a straightforward `incident` Table API pull this phase. Instead, the mapper derives a placeholder SLA countdown server-side from `priority` + `opened_at` (e.g. Critical 1hr / High 4hr / Medium 8hr / Low 24hr window minus elapsed time), color-coded per the red/amber/neutral thresholds already defined above. This is a heuristic placeholder, not real ServiceNow SLA data — flagged here per the PRD's explicit allowance to do this.

## Folder structure

```
L1_dispatcher/
  frontend/   Vite React app — src/components, src/pages, src/services, src/context
  backend/    FastAPI app — app/main.py, app/routes/tickets.py, app/integrations/servicenow.py,
              app/mapping/ticket_mapper.py, app/config.py, app/mock_data.py, .env.example
  docs/       PRD + reference images (existing)
  CLAUDE.md
```

## Data layer conventions

- Frontend: keep API calls behind a thin service layer (`/src/services/ticketsService.js` etc.) — components should not call `fetch` directly.
- Backend: keep ServiceNow-specific logic isolated in its own module (e.g. `app/integrations/servicenow.py`) behind a clean function interface (`get_incidents()`, `map_incident(raw)` etc.), so it's easy to extend or swap later.

## Non-goals right now

- No real auth/DB (login/register stay static)
- No real agent/LLM behind the chat page
- No real execution of reminder/escalate actions (display + mock confirmation only)
- No production deployment concerns

## Working style

- Build in phases: (1) review brief + finalize OPEN decisions + update this file, (2) project scaffold (frontend + FastAPI) + design tokens/theme, (3) login/register static, (4) FastAPI ServiceNow integration + tickets/dashboard page wired to it, (5) AI agent page (static), (6) polish/export. Confirm each phase with me before moving to the next.
- Ask me before introducing a new major dependency.
- If ServiceNow credentials aren't provided yet, say so explicitly and proceed with the mock-fallback path rather than blocking.
