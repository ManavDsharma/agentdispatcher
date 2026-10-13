"""
AgentCore Runtime client.

Invokes dtp_agent after it has been deployed to an Amazon Bedrock
AgentCore Runtime.

The client:
- Uses the boto3 bedrock-agentcore client.
- Supports runtime session IDs.
- Passes prompt and actor identity to the AgentCore runtime.
- Supports an optional AgentCore qualifier.
- Returns response, structured data, and metadata.
- Raises AgentClientError so agent_service can handle failures gracefully.
"""

import json
from typing import Any

import boto3

from app.config import settings


_client = None


class AgentClientError(Exception):
    """Raised when AgentCore Runtime invocation fails."""

    pass


def _get_client():
    """
    Create and cache the boto3 AgentCore client.
    """

    global _client

    if _client is None:
        kwargs = {
            "region_name": settings.resolved_aws_region,
        }

        # Use explicit credentials only when configured.
        # Otherwise boto3 uses the normal AWS credential provider chain,
        # which is preferred when running on AWS infrastructure.
        if (
            settings.aws_access_key_id
            and settings.aws_secret_access_key
        ):
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = (
                settings.aws_secret_access_key
            )

        _client = boto3.client(
            "bedrock-agentcore",
            **kwargs,
        )

    return _client


async def invoke(
    prompt: str,
    session_id: str,
    actor_id: str | None = None,
) -> dict[str, Any]:
    """
    Invoke the deployed AgentCore Runtime.

    Args:
        prompt:
            User's chat prompt.

        session_id:
            Frontend conversation/session identifier.
            AgentCore requires runtimeSessionId to be at least
            33 characters.

        actor_id:
            Authenticated user/actor identifier. This is passed to
            the AgentCore runtime so the downstream agent can use
            it for identity, audit, authorization, or memory
            scoping if required.

    Returns:
        Dictionary containing:
            response:
                Agent's natural-language response.

            structured:
                Optional structured response intended for UI rendering.

            metadata:
                Optional metadata returned by the AgentCore runtime.

    Raises:
        AgentClientError:
            If the runtime ARN is missing or invocation fails.
    """

    # ------------------------------------------------------------
    # Validate AgentCore configuration
    # ------------------------------------------------------------

    if not settings.agentcore_runtime_arn:
        raise AgentClientError(
            "AGENTCORE_RUNTIME_ARN is not configured"
        )

    # ------------------------------------------------------------
    # AgentCore runtime session ID
    # ------------------------------------------------------------

    # AgentCore requires runtimeSessionId to be at least 33 characters.
    #
    # Normal UUIDs are 36 characters, so they are already valid.
    # For shorter application-generated session IDs, pad them.
    runtime_session_id = (
        session_id
        if len(session_id) >= 33
        else session_id.ljust(33, "0")
    )

    # ------------------------------------------------------------
    # Runtime invocation payload
    # ------------------------------------------------------------

    payload = {
        "prompt": prompt,
        "actor_id": actor_id,
    }

    kwargs = {
        "agentRuntimeArn": settings.agentcore_runtime_arn,
        "runtimeSessionId": runtime_session_id,
        "contentType": "application/json",
        "accept": "application/json",
        "payload": json.dumps(payload).encode("utf-8"),
    }

    # Optional AgentCore qualifier.
    if settings.agentcore_runtime_qualifier:
        kwargs["qualifier"] = settings.agentcore_runtime_qualifier

    # ------------------------------------------------------------
    # Invoke AgentCore Runtime
    # ------------------------------------------------------------

    try:
        response = _get_client().invoke_agent_runtime(
            **kwargs
        )

        raw_body = response["response"].read()

        if isinstance(raw_body, bytes):
            raw_body = raw_body.decode("utf-8")

        body = json.loads(raw_body)

    except Exception as exc:
        raise AgentClientError(
            f"AgentCore Runtime invocation failed: {exc}"
        ) from exc

    # ------------------------------------------------------------
    # Handle application-level errors returned by the runtime
    # ------------------------------------------------------------

    if isinstance(body, dict) and "error" in body:
        raise AgentClientError(
            body.get("message")
            or body.get("error")
            or "AgentCore Runtime returned an error"
        )

    # ------------------------------------------------------------
    # Normalize response
    # ------------------------------------------------------------

    if not isinstance(body, dict):
        return {
            "response": str(body),
            "structured": None,
            "metadata": {},
        }

    return {
        "response": body.get("response", ""),
        "structured": body.get("structured"),
        "metadata": body.get("metadata", {}),
    }