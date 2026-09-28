"""Calls dtp_agent's local AgentCore dev server (`python main.py` -> `app.run()`).

That local server implements AgentCore's local-testing HTTP contract —
POST /invocations with the same payload the real @app.entrypoint receives,
GET /ping for a liveness check — so this is a plain HTTP call, not anything
AgentCore-specific. Verify the exact port/path against the actual running
dtp_agent server; this assumes the SDK's documented default.
"""

import httpx

from app.config import settings


class AgentClientError(Exception):
    pass


async def invoke(prompt: str, session_id: str) -> dict:
    payload = {"prompt": prompt, "session_id": session_id}

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(settings.agent_local_url, json=payload)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise AgentClientError(f"dtp_agent returned HTTP {exc.response.status_code}") from exc
    except httpx.RequestError as exc:
        raise AgentClientError(f"Could not reach dtp_agent locally: {exc}") from exc

    body = response.json()

    # main.py's entrypoint always returns a dict — either {"response",
    # "metadata"} on success or {"error", "message"} on a handled failure.
    if "error" in body:
        raise AgentClientError(body.get("message") or body["error"])

    return {
        "response": body.get("response", ""),
        "metadata": body.get("metadata", {}),
    }
