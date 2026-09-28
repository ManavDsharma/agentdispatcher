"""Calls dtp_agent once it's deployed to a real Amazon Bedrock AgentCore
Runtime. Real implementation, built ahead of deployment — will raise
AgentClientError (caught by agent_service's fallback) until
AGENTCORE_RUNTIME_ARN is actually set, which is expected until then.

boto3's bedrock-agentcore client and its invoke_agent_runtime operation shape
were confirmed directly against the installed SDK (boto3>=1.42), not assumed.
"""

import json

import boto3

from app.config import settings

_client = None


class AgentClientError(Exception):
    pass


def _get_client():
    global _client
    if _client is None:
        kwargs = {"region_name": settings.resolved_aws_region}
        if settings.aws_access_key_id and settings.aws_secret_access_key:
            kwargs["aws_access_key_id"] = settings.aws_access_key_id
            kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        _client = boto3.client("bedrock-agentcore", **kwargs)
    return _client


async def invoke(prompt: str, session_id: str) -> dict:
    if not settings.agentcore_runtime_arn:
        raise AgentClientError("AGENTCORE_RUNTIME_ARN is not configured")

    # AgentCore requires runtimeSessionId to be at least 33 characters — a
    # standard UUID (36 chars) clears that; anything shorter needs padding.
    runtime_session_id = session_id if len(session_id) >= 33 else session_id.ljust(33, "0")

    kwargs = {
        "agentRuntimeArn": settings.agentcore_runtime_arn,
        "runtimeSessionId": runtime_session_id,
        "contentType": "application/json",
        "accept": "application/json",
        "payload": json.dumps({"prompt": prompt}).encode("utf-8"),
    }
    if settings.agentcore_runtime_qualifier:
        kwargs["qualifier"] = settings.agentcore_runtime_qualifier

    try:
        response = _get_client().invoke_agent_runtime(**kwargs)
        body = json.loads(response["response"].read())
    except Exception as exc:  # botocore raises various ClientError subtypes
        raise AgentClientError(f"AgentCore Runtime invocation failed: {exc}") from exc

    if "error" in body:
        raise AgentClientError(body.get("message") or body["error"])

    return {
        "response": body.get("response", ""),
        "metadata": body.get("metadata", {}),
    }
