# AI Agent Integration

How the frontend's AI Agent chat page connects to `dtp_agent` — a separate
Strands Agents application built for Amazon Bedrock AgentCore Runtime, living
in its own repo, not part of this codebase.

## Architecture

```
Browser                    Our FastAPI backend                  dtp_agent
┌─────────────┐  WS        ┌──────────────────────┐   HTTP (local)   ┌─────────────┐
│ AIAgentPage  │──────────▶│ /ws/agent             │  POST /invocations│ main.py      │
│ (chat UI)    │◀──────────│  → agent_service.py   │──────────────────▶│ @entrypoint  │
└─────────────┘  JSON msgs │    → agent_client_*   │                   └─────────────┘
                            └──────────────────────┘   boto3 invoke_agent_runtime
                                                        (once deployed to AgentCore)
```

**The WebSocket only exists between the browser and our backend.** AgentCore
Runtime is not something you open a socket to — once deployed, it's invoked
exclusively through AWS's `bedrock-agentcore` API (SigV4-authenticated
`invoke_agent_runtime` calls via boto3), the same shape as calling any other
managed AWS service. Locally, `dtp_agent`'s `app.run()` starts an HTTP dev
server implementing AgentCore's local-testing contract (`POST /invocations`,
`GET /ping`) — still HTTP, not a socket. So the WebSocket sits at the one hop
where it actually makes sense (browser ↔ our backend, for a responsive chat
UI with room to add token streaming later), and the backend↔dtp_agent hop is
a plain backend-to-backend service call that swaps transport by config.

Our backend never imports `dtp_agent`'s Python code — it's always called as
an external service, exactly how it runs in production (a separate
AWS-managed process). Local dev already matches that topology.

## Config modes

Set in `backend/.env` (see `.env.example` for the exact keys — not
reproduced here since this file isn't a place for real values):

| `AGENT_MODE` | What happens | Needs |
|---|---|---|
| `local` (default) | HTTP POST to `AGENT_LOCAL_URL` (`dtp_agent`'s `app.run()` dev server) | `dtp_agent` running locally |
| `agentcore` | `boto3` `bedrock-agentcore` client, `invoke_agent_runtime` | `AGENTCORE_RUNTIME_ARN` set, AWS credentials |

Both client implementations (`backend/app/integrations/agent_client_local.py`,
`agent_client_agentcore.py`) are real, not stubs — `agent_mode` is a pure
config switch, so deploying `dtp_agent` to AgentCore later is a `.env` change
only, no code change on this side.

**If the configured client fails for any reason** (not configured, unreachable,
error), `agent_service.invoke_agent()` catches it and returns a canned
placeholder response instead of erroring — same "always demoable" fallback
philosophy used for the ticket store and reference tables elsewhere in this
app. The response includes `source: "agent" | "fallback"` so the frontend
(and you, debugging) can tell which happened.

## Contracts

**Frontend ↔ backend, over `ws://<backend>/ws/agent`:**
- Client → server: `{"prompt": "...", "session_id": "<uuid>"}`. `session_id`
  is generated once per page mount (`crypto.randomUUID()`) and resent with
  every message in that session so `dtp_agent`'s conversation memory persists
  across turns; a "Reset" click in the UI generates a fresh one and closes/
  reopens the socket.
- Server → client: `{"type": "response", "response": "...", "metadata": {...},
  "source": "agent"|"fallback", "error"?: "..."}`. The frontend only acts on
  `type: "response"` today; `type: "error"` is reserved for malformed client
  messages.

**Backend ↔ dtp_agent, local mode (`POST {AGENT_LOCAL_URL}`, default
`http://localhost:8080/invocations`):** body `{"prompt": "...", "session_id":
"..."}`, matching `main.py`'s documented entrypoint input. Response is
whatever `invoke()` returns verbatim — either `{"response": "...", "metadata":
{...}}` or `{"error": "...", "message": "..."}` on a handled failure.

**Backend ↔ dtp_agent, AgentCore mode:** `bedrock-agentcore` boto3 client,
`invoke_agent_runtime(agentRuntimeArn=..., runtimeSessionId=<session_id, min
33 chars — a UUID clears this>, contentType="application/json",
accept="application/json", payload=<json bytes of {"prompt": ...}>)`. The
response's `response` field is a streaming body; we `.read()` and
`json.loads()` it. Operation shape was confirmed directly against the
installed `boto3` SDK (`boto3>=1.42` — this project's `boto3==1.35.99` didn't
have the `bedrock-agentcore` client at all and was upgraded), not assumed.

## Checklist for when you deploy to AgentCore Runtime

1. Set `AGENTCORE_RUNTIME_ARN` (and `AGENTCORE_RUNTIME_QUALIFIER` if you're
   targeting a specific endpoint/version) in `backend/.env`.
2. Set `AGENT_MODE=agentcore`.
3. Make sure the backend's AWS credentials (`AWS_ACCESS_KEY_ID`/
   `AWS_SECRET_ACCESS_KEY`, same vars already used for DynamoDB) have
   `bedrock-agentcore:InvokeAgentRuntime` permission.
4. Restart the backend. Nothing else changes — frontend, WebSocket route,
   and `agent_service` call site are all identical between modes.

## Known gaps / verify hands-on

- The local dev server's exact port/path (`:8080/invocations`, `/ping`) is
  the AgentCore SDK's documented default, not confirmed against `dtp_agent`'s
  actual `router.py`/`config.py` (not visible from this repo). If it differs,
  update `AGENT_LOCAL_URL` in `.env`.
- Whether the *local* dev server actually honors `session_id` for
  conversation continuity (vs. only the deployed AgentCore service via
  `context.session_id`) hasn't been confirmed hands-on — worth checking once
  you're running multi-turn conversations locally.
