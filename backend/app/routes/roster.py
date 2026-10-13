"""Roster upload endpoints (used by the AI Agent chat's attach button).

    POST /api/roster/uploads                  validate a .xlsx/.csv, write nothing
    POST /api/roster/uploads/{id}/commit      write the validated rows
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.services import roster_file_reader, roster_upload_service
from app.services.roster_file_reader import RosterFileError
from app.store.roster_repository import RosterWriteError

router = APIRouter(prefix="/api/roster", tags=["roster"])


@router.post("/uploads")
async def validate_roster_upload(
    file: UploadFile = File(...),
    uploaded_by: str = Form(""),
):
    # Read one byte past the limit so an oversize file is detected without
    # pulling an arbitrarily large body into memory.
    content = await file.read(roster_file_reader.MAX_FILE_BYTES + 1)
    try:
        return await roster_upload_service.stage_upload(file.filename or "", content, uploaded_by)
    except RosterFileError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))


@router.post("/uploads/{upload_id}/commit")
async def commit_roster_upload(upload_id: str):
    try:
        return await roster_upload_service.commit_upload(upload_id)
    except roster_upload_service.UploadNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except roster_upload_service.UploadConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except RosterWriteError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Writing to DynamoDB failed after {exc.written} row(s): {exc}. You can retry — rows already written won't be duplicated.",
        )
