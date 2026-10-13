"""
Local AI Agent client.

Used only when:

    AGENT_MODE=local

The local agent is expected to expose:

    POST http://localhost:8080/invocations
"""

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

SESSION_HEADER = "X-Amzn-Bedrock-AgentCore-Runtime-Session-Id"


class AgentClientError(Exception):
    """Raised when the local agent cannot be invoked."""


def _agent_error(body: dict) -> dict:
    """
    Convert an agent error into the standard response contract.
    """

    message = (
        body.get("message")
        or body.get("error")
        or "The agent could not complete that request."
    )

    return {
        "response": message,
        "structured": {
            "type": "error",
            "message": message,
            "text": message,
            "tone": "error",
        },
        "metadata": {},
    }


async def invoke(
    prompt: str,
    session_id: str,
    actor_id: str | None = None,
) -> dict:
    """
    Invoke the local agent.

    Contract:

        {
            "response": str,
            "structured": dict | None,
            "metadata": dict
        }
    """

    payload = {
        "prompt": prompt,
    }

    if actor_id:
        payload["actor_id"] = actor_id

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                settings.agent_local_url,
                json=payload,
                headers={
                    SESSION_HEADER: session_id,
                },
            )

        response.raise_for_status()

        body = response.json()

    except httpx.TimeoutException as exc:
        raise AgentClientError(
            "Local agent request timed out."
        ) from exc

    except httpx.HTTPStatusError as exc:
        raise AgentClientError(
            f"Local agent returned HTTP {exc.response.status_code}."
        ) from exc

    except Exception as exc:
        raise AgentClientError(
            f"Local agent invocation failed: {exc}"
        ) from exc

    if not isinstance(body, dict):
        raise AgentClientError(
            "Local agent returned an invalid response."
        )

    if "error" in body:
        return _agent_error(body)

    return {
        "response": body.get("response", ""),
        "structured": body.get("structured"),
        "metadata": body.get("metadata", {}),
    }
