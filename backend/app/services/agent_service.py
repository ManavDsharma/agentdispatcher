"""
AI Agent orchestration layer.

Selects either:

    AgentCore Runtime
or
    Local Agent

based on AGENT_MODE.

The service deliberately returns a safe fallback response when the
agent cannot be reached so the frontend chat remains functional.
"""

import logging

from app.config import settings
from app.integrations import (
    agent_client_agentcore,
    agent_client_local,
)

logger = logging.getLogger(__name__)


_FALLBACK_RESPONSE = (
    "I couldn't reach the assistant just now, so this is a placeholder "
    "reply. Once connected, I can look up and update incidents and "
    "requests, check category-matrix issues, and tell you who is on "
    "shift or available."
)


_FALLBACK_STRUCTURED = {
    "type": "error",
    "message": _FALLBACK_RESPONSE,
    "text": _FALLBACK_RESPONSE,
    "tone": "error",
}


def _get_client():
    """
    Select the configured agent client.
    """

    mode = (settings.agent_mode or "local").strip().lower()

    if mode == "agentcore":
        return agent_client_agentcore

    if mode == "local":
        return agent_client_local

    raise ValueError(
        f"Unsupported AGENT_MODE: {settings.agent_mode}"
    )


async def invoke_agent(
    prompt: str,
    session_id: str,
    actor_id: str | None = None,
) -> dict:
    """
    Invoke the configured AI Agent.

    Returns:

        {
            "response": str,
            "structured": dict | None,
            "metadata": dict,
            "source": "agent" | "fallback"
        }
    """

    try:
        client = _get_client()

        logger.debug(
            "Invoking AI agent: mode=%s actor=%s session=%s",
            settings.agent_mode,
            actor_id,
            session_id,
        )

        result = await client.invoke(
            prompt=prompt,
            session_id=session_id,
            actor_id=actor_id,
        )

        return {
            "response": result.get("response", ""),
            "structured": result.get("structured"),
            "metadata": result.get("metadata", {}),
            "source": "agent",
        }

    except Exception as exc:
        # Never expose internal AWS/runtime details to the browser.
        logger.warning(
            "Agent invocation failed (mode=%s): %s",
            settings.agent_mode,
            exc,
        )

        return {
            "response": _FALLBACK_RESPONSE,
            "structured": _FALLBACK_STRUCTURED,
            "metadata": {},
            "source": "fallback",
        }