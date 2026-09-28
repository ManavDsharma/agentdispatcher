"""WebSocket bridge between the frontend chat UI and agent_service.

One connection per page load. Each incoming message is {"prompt", "session_id"}
(the session_id is generated client-side once per mount so dtp_agent's
conversation memory persists across turns); each outgoing message is
agent_service.invoke_agent()'s result tagged with a "type" the frontend
switches on.
"""

import logging

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.services import agent_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/api/agent/health")
async def agent_health():
    """Powers the Sidebar's AI Agent status dot — a liveness check, not a
    full invocation (invoking the real agent just to check health would be
    wasteful, especially in agentcore mode)."""
    if settings.agent_mode == "agentcore":
        return {"mode": "agentcore", "configured": bool(settings.agentcore_runtime_arn)}

    ping_url = settings.agent_local_url.rsplit("/invocations", 1)[0] + "/ping"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(ping_url)
        reachable = response.status_code == 200
    except Exception:
        reachable = False
    return {"mode": "local", "configured": True, "reachable": reachable}


@router.websocket("/ws/agent")
async def agent_websocket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            try:
                data = await websocket.receive_json()
            except WebSocketDisconnect:
                raise
            except Exception:
                await websocket.send_json({"type": "error", "message": "Malformed message"})
                continue

            prompt = (data.get("prompt") or "").strip()
            session_id = data.get("session_id") or "default-session-0000000000000000"
            if not prompt:
                continue

            result = await agent_service.invoke_agent(prompt, session_id)
            await websocket.send_json({"type": "response", **result})
    except WebSocketDisconnect:
        logger.info("Agent WebSocket client disconnected")
