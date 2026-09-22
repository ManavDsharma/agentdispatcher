from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.integrations import servicenow
from app.mapping.issue_mapper import (
    CLASSIFICATION_CHOICES,
    ISSUE_TYPE_CHOICES,
    PRIORITY_CHOICES,
    build_create_payload,
    map_issue,
)
from app.mock_data import get_mock_issues

router = APIRouter(prefix="/api", tags=["issues"])


class CreateIssueRequest(BaseModel):
    short_description: str
    description: Optional[str] = None
    classification: Optional[str] = None
    priority: Optional[str] = None
    issue_type: Optional[str] = None
    issue_rating: Optional[str] = None


@router.get("/issues")
async def list_issues():
    if not settings.servicenow_configured:
        return {"issues": get_mock_issues(), "source": "mock", "reason": "not_configured", "error": None}

    try:
        raw_issues = await servicenow.get_issues(limit=50)
    except servicenow.ServiceNowError as exc:
        return {
            "issues": get_mock_issues(),
            "source": "mock",
            "reason": "connection_error",
            "error": str(exc),
        }

    issues = [map_issue(record) for record in raw_issues]
    return {"issues": issues, "source": "servicenow", "reason": None, "error": None}


@router.get("/issues/options")
async def issue_options():
    if settings.servicenow_configured:
        try:
            issue_ratings = await servicenow.get_issue_ratings()
        except servicenow.ServiceNowError:
            issue_ratings = []
    else:
        issue_ratings = []

    return {
        "classification": CLASSIFICATION_CHOICES,
        "priority": PRIORITY_CHOICES,
        "issue_type": ISSUE_TYPE_CHOICES,
        "issue_rating": issue_ratings,
    }


@router.post("/issues")
async def create_issue(body: CreateIssueRequest):
    if not settings.servicenow_configured:
        raise HTTPException(status_code=503, detail="ServiceNow is not configured")

    payload = build_create_payload(body.model_dump())
    try:
        result = await servicenow.create_issue(payload)
    except servicenow.ServiceNowError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    sys_id = result.get("sys_id")
    instance_url = (settings.servicenow_instance_url or "").rstrip("/")
    issue_url = f"{instance_url}/nav_to.do?uri=sn_grc_issue.do?sys_id={sys_id}" if instance_url and sys_id else None

    return {"number": result.get("number"), "sys_id": sys_id, "issue_url": issue_url}
