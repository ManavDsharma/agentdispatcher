"""
Amazon Bedrock AgentCore Runtime client.

This client is used when:

    AGENT_MODE=agentcore

It invokes the deployed AgentCore Runtime using boto3's
bedrock-agentcore client.
"""

import json
import logging

import boto3

from app.config import settings

logger = logging.getLogger(__name__)

_client = None


class AgentClientError(Exception):
    """Raised when AgentCore cannot be invoked."""


def _get_client():
    """
    Lazily create the AgentCore boto3 client.

    Explicit AWS credentials are supported for local development.
    In AWS environments, boto3's normal credential chain / IAM role
    should be preferred.
    """

    global _client

    if _client is None:
        kwargs = {
            "region_name": settings.resolved_aws_region,
        }

        if (
            settings.aws_access_key_id
            and settings.aws_secret_access_key
        ):
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key

        _client = boto3.client(
            "bedrock-agentcore",
            **kwargs,
        )

    return _client


def _normalize_response(body: dict) -> dict:
    """
    Normalize AgentCore's response to the common agent-service contract.
    """

    if not isinstance(body, dict):
        raise AgentClientError(
            "AgentCore returned an invalid response format."
        )

    if "error" in body:
        message = (
            body.get("message")
            or body.get("error")
            or "AgentCore returned an error."
        )

        raise AgentClientError(message)

    return {
        "response": body.get("response", ""),
        "structured": body.get("structured"),
        "metadata": body.get("metadata", {}),
    }


async def invoke(
    prompt: str,
    session_id: str,
    actor_id: str | None = None,
) -> dict:
    """
    Invoke the deployed AgentCore Runtime.

    Contract:

        {
            "response": str,
            "structured": dict | None,
            "metadata": dict
        }
    """

    if not settings.agentcore_runtime_arn:
        raise AgentClientError(
            "AGENTCORE_RUNTIME_ARN is not configured."
        )

    if not prompt or not prompt.strip():
        raise AgentClientError(
            "Agent prompt cannot be empty."
        )

    # AgentCore requires runtimeSessionId to be at least 33 characters.
    runtime_session_id = session_id or "default-session"

    if len(runtime_session_id) < 33:
        runtime_session_id = runtime_session_id.ljust(33, "0")

    payload = {
        "prompt": prompt,
    }

    if actor_id:
        payload["actor_id"] = actor_id

    kwargs = {
        "agentRuntimeArn": settings.agentcore_runtime_arn,
        "runtimeSessionId": runtime_session_id,
        "contentType": "application/json",
        "accept": "application/json",
        "payload": json.dumps(payload).encode("utf-8"),
    }

    if settings.agentcore_runtime_qualifier:
        kwargs["qualifier"] = settings.agentcore_runtime_qualifier

    try:
        response = _get_client().invoke_agent_runtime(**kwargs)

        raw_response = response.get("response")

        if raw_response is None:
            raise AgentClientError(
                "AgentCore returned no response body."
            )

        raw_body = raw_response.read()

        if isinstance(raw_body, bytes):
            raw_body = raw_body.decode("utf-8")

        try:
            body = json.loads(raw_body)
        except json.JSONDecodeError as exc:
            raise AgentClientError(
                "AgentCore returned invalid JSON."
            ) from exc

    except AgentClientError:
        raise

    except Exception as exc:
        logger.exception(
            "AgentCore Runtime invocation failed."
        )

        raise AgentClientError(
            f"AgentCore Runtime invocation failed: {exc}"
        ) from exc

    return _normalize_response(body)
