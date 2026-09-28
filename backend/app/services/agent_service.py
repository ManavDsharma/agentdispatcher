"""Orchestrates AI Agent invocation: picks the client by AGENT_MODE, falls
back to a canned response on any failure so the chat page is never broken —
same resilience philosophy as the ticket/reference data fallbacks."""

import logging

from app.config import settings
from app.integrations import agent_client_agentcore, agent_client_local

logger = logging.getLogger(__name__)

_FALLBACK_RESPONSE = (
    "I couldn't reach the live agent just now, so this is a placeholder reply. "
    "Once connected, I can help with bot failure diagnosis, asset management, "
    "schedule control, job management, and information queries."
)


async def invoke_agent(prompt: str, session_id: str) -> dict:
    client = agent_client_agentcore if settings.agent_mode == "agentcore" else agent_client_local

    try:
        result = await client.invoke(prompt, session_id)
        return {"response": result["response"], "metadata": result["metadata"], "source": "agent"}
    except Exception as exc:
        logger.warning("Agent invocation failed (mode=%s): %s", settings.agent_mode, exc)
        return {
            "response": _FALLBACK_RESPONSE,
            "metadata": {},
            "source": "fallback",
            "error": str(exc),
        }
