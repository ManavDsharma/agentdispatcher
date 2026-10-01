"""Client for the external "Show Similar Incidents" API Gateway endpoint.

Separate service from ServiceNow itself — an AWS API Gateway-fronted matcher
that takes the in-progress Create Issue form fields and returns the top
similar past issues. Isolated here the same way servicenow.py isolates the
ServiceNow Table API, so the route/frontend never talk to it directly.
"""

import httpx

from app.config import settings

# The matcher can take 5-10s to respond — give it real headroom.
REQUEST_TIMEOUT = 30.0


class SimilarIssuesError(Exception):
    pass


async def find_similar_issues(payload: dict) -> dict:
    if not settings.similar_issues_configured:
        raise SimilarIssuesError("Similar issues API is not configured")

    headers = {}
    if settings.similar_issues_api_key:
        headers["x-api-key"] = settings.similar_issues_api_key

    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.post(
                settings.similar_issues_api_url,
                json=payload,
                headers=headers,
            )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise SimilarIssuesError(f"Similar issues service returned HTTP {exc.response.status_code}") from exc
    except httpx.RequestError as exc:
        raise SimilarIssuesError(f"Could not reach similar issues service: {exc}") from exc

    return response.json()
