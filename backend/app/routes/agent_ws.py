"""
WebSocket bridge between the frontend chat UI and agent_service.

HTTP endpoints:

    GET  /api/agent/health
    POST /api/agent/test

WebSocket:

    /ws/agent
"""

import logging
import re

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.config import settings
from app.services import agent_service

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_PROMPT_CHARS = 2000

DEFAULT_SESSION_ID = "default-session-0000000000000000"

_SESSION_ID = re.compile(
    r"^[\w.:@-]{8,128}$"
)


def _actor_for(websocket: WebSocket) -> str:
    """
    Determine the actor associated with the WebSocket.

    Authentication middleware/proxy should eventually provide the
    authenticated user's identity.

    Current supported headers:
        X-User-Email
        X-Forwarded-Email
    """

    header = (
        websocket.headers.get("x-user-email")
        or websocket.headers.get("x-forwarded-email")
    )

    return (
        header
        or getattr(settings, "agent_default_actor", None)
        or "dtp-web-user"
    )


class AgentTestRequest(BaseModel):
    prompt: str = "Say hello and confirm that you are running."


@router.post("/api/agent/test")
async def test_agent(request: AgentTestRequest):
    """
    Backend-only test endpoint for verifying actual agent invocation.

    Unlike /api/agent/health, this DOES invoke the configured agent.
    """

    return await agent_service.invoke_agent(
        prompt=request.prompt,
        session_id="backend-test-session-12345678901234567890",
        actor_id="backend-test-user",
    )


@router.get("/api/agent/health")
async def agent_health():
    """
    Lightweight AI Agent health check.

    IMPORTANT:
    This endpoint intentionally does not invoke the actual LLM/AgentCore
    runtime every time the sidebar refreshes.

    For AgentCore mode it verifies that the runtime configuration exists.

    For local mode it checks the local /ping endpoint.
    """

    mode = (settings.agent_mode or "local").strip().lower()

    # ============================================================
    # AGENTCORE
    # ============================================================

    if mode == "agentcore":
        configured = bool(
            settings.agentcore_runtime_arn
        )

        return {
            "status": "ok" if configured else "error",
            "healthy": configured,
            "mode": "agentcore",
            "configured": configured,
            "runtime_configured": configured,
        }

    # ============================================================
    # LOCAL
    # ============================================================

    if mode == "local":

        ping_url = (
            settings.agent_local_url
            .rsplit("/invocations", 1)[0]
            + "/ping"
        )

        try:
            async with httpx.AsyncClient(
                timeout=3.0
            ) as client:

                response = await client.get(
                    ping_url
                )

            reachable = response.status_code == 200

        except Exception:
            reachable = False

        return {
            "status": "ok" if reachable else "error",
            "healthy": reachable,
            "mode": "local",
            "configured": True,
            "reachable": reachable,
        }

    # ============================================================
    # INVALID MODE
    # ============================================================

    return {
        "status": "error",
        "healthy": False,
        "mode": mode,
        "configured": False,
        "error": f"Unsupported AGENT_MODE: {settings.agent_mode}",
    }


@router.websocket("/ws/agent")
async def agent_websocket(
    websocket: WebSocket,
):
    """
    Main frontend chat WebSocket.
    """

    await websocket.accept()

    actor_id = _actor_for(websocket)

    try:

        while True:

            try:
                data = await websocket.receive_json()

            except WebSocketDisconnect:
                raise

            except Exception:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Malformed message",
                    }
                )
                continue

            if not isinstance(data, dict):
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Malformed message",
                    }
                )
                continue

            prompt = str(
                data.get("prompt") or ""
            ).strip()

            if not prompt:
                continue

            if len(prompt) > MAX_PROMPT_CHARS:
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": (
                            f"Please keep messages under "
                            f"{MAX_PROMPT_CHARS} characters."
                        ),
                    }
                )
                continue

            session_id = str(
                data.get("session_id") or ""
            )

            if not _SESSION_ID.match(session_id):
                session_id = DEFAULT_SESSION_ID

            result = await agent_service.invoke_agent(
                prompt=prompt,
                session_id=session_id,
                actor_id=actor_id,
            )

            await websocket.send_json(
                {
                    "type": "response",
                    **result,
                }
            )

    except WebSocketDisconnect:
        logger.info(
            "Agent WebSocket client disconnected."
        )

    except Exception:
        logger.exception(
            "Unexpected Agent WebSocket error."
        )

        try:
            await websocket.close(
                code=1011
            )
        except Exception:
            pass