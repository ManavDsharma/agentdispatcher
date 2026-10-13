"""Roster upload orchestration: parse -> validate -> stage -> (user confirms) -> write.

Nothing is written by the validate step. A successful validation stages the
cleaned rows server-side under an `upload_id`; the commit step writes exactly
those rows, so the browser can't alter what was validated. Each staged row is
given its UID at validation time, which makes a retried commit idempotent
(same UID -> overwrite, not a duplicate row).

Staged uploads live in process memory (30-minute TTL): fine for one uvicorn
worker, and a restart just means "attach the file again".
"""

from __future__ import annotations

import json
import time
import uuid
from collections import Counter
from datetime import datetime
from typing import Dict, List, Optional

from app.domain import roster_schema as schema
from app.services import roster_file_reader
from app.services.roster_file_reader import RosterFileError
from app.store import roster_repository
from app.store.roster_repository import RosterWriteError

STAGE_TTL_SECONDS = 30 * 60
MAX_REPORTED_ISSUES = 50
PREVIEW_ROWS = 5
MAX_EXISTING_EXAMPLES = 5
DEFAULT_UPDATED_BY = "roster-upload"

# Columns shown in the chat preview table (the rest are still written).
PREVIEW_FIELDS = ["team_id", "emp_id", "employee_name", "year", "month", "days_availability", "level", "shift", "active"]


class UploadNotFoundError(Exception):
    pass


class UploadConflictError(Exception):
    pass


_staged: Dict[str, dict] = {}


def _now() -> str:
    return datetime.now().isoformat(sep=" ", timespec="seconds")


def _purge_expired() -> None:
    cutoff = time.time() - STAGE_TTL_SECONDS
    for upload_id in [k for k, v in _staged.items() if v["created"] < cutoff]:
        del _staged[upload_id]


def _pick_sheet(sheets: List[roster_file_reader.Sheet]):
    """First sheet that has a recognisable roster header row."""
    best = None
    for sheet in sheets:
        found = schema.find_header_row(sheet.rows)
        if found and (best is None or found[1].matched_count > best[2].matched_count):
            best = (sheet, found[0], found[1])
    return best


def _missing_required(match: schema.HeaderMatch) -> List[str]:
    return [m.column.header for m in match.matches if m.column.required and m.index is None]


async def stage_upload(filename: str, content: bytes, uploaded_by: str = "") -> dict:
    _purge_expired()
    sheets = roster_file_reader.read_upload(filename, content)

    picked = _pick_sheet(sheets)
    if picked is None:
        expected = ", ".join(c.header for c in schema.COLUMNS)
        raise RosterFileError(
            "Couldn't find a roster header row in this file. "
            f"Expected columns like: {expected}.",
            422,
        )
    sheet, header_idx, match = picked

    errors: List[dict] = []
    warnings: List[str] = []

    def add_error(row: int, column: str, message: str) -> None:
        errors.append({"row": row, "column": column, "message": message})

    missing = _missing_required(match)
    for header in missing:
        add_error(header_idx + 1, header, "Required column not found in the file")

    for m in match.matches:
        if m.index is None and not m.column.required:
            warnings.append(f"Column '{m.column.header}' was not found — it will be left blank.")
        elif m.kind == "fuzzy":
            warnings.append(f"Read column '{m.found_as}' as '{m.column.header}' — check this is right.")
    if match.ignored:
        warnings.append("Ignored columns not in the roster format: " + ", ".join(match.ignored))

    columns_report = [
        {
            "expected": m.column.header,
            "found": m.found_as,
            "match": m.kind,
            "required": m.column.required,
        }
        for m in match.matches
    ]

    # ---- rows -----------------------------------------------------------
    index_of = {m.column.field: m.index for m in match.matches if m.index is not None}
    data_rows = sheet.rows[header_idx + 1 :]
    clean_rows: List[dict] = []
    seen: Dict[tuple, int] = {}
    total_rows = 0
    blank_availability = 0
    short_availability: List[int] = []  # rows whose day count != days in that month

    for offset, cells in enumerate(data_rows):
        sheet_row = header_idx + 2 + offset
        if not any(str(c).strip() for c in cells):
            continue
        total_rows += 1
        if missing:
            continue  # can't judge rows without the required columns

        raw = {
            field: (cells[i] if i < len(cells) else "")
            for field, i in index_of.items()
        }
        for column in schema.COLUMNS:
            raw.setdefault(column.field, "")

        clean, row_errors = schema.validate_row(raw)
        for field, message in row_errors:
            add_error(sheet_row, schema.COLUMN_BY_FIELD[field].header, message)

        if not row_errors:
            key = schema.row_key(clean)
            if key in seen:
                add_error(
                    sheet_row,
                    "Emp ID",
                    f"Duplicate of row {seen[key]} (same team, employee, year and month)",
                )
            else:
                seen[key] = sheet_row
                if not clean.get("days_availability"):
                    blank_availability += 1
                else:
                    year, month = schema.year_number(clean["year"]), schema.month_number(clean["month"])
                    expected_days = schema.days_in_month(year, month)
                    if len(json.loads(clean["days_availability"])) != expected_days:
                        short_availability.append(sheet_row)
                clean["_sheet_row"] = str(sheet_row)  # internal; stripped before writing
                clean_rows.append(clean)

    if total_rows == 0:
        add_error(header_idx + 1, "", "The file has a header row but no roster rows below it")
    if blank_availability and "days_availability" in index_of:
        warnings.append(f"Days_Availability is blank on {blank_availability} row(s).")
    if short_availability:
        shown = ", ".join(str(r) for r in short_availability[:5])
        more = f" and {len(short_availability) - 5} more" if len(short_availability) > 5 else ""
        warnings.append(
            f"Days_Availability doesn't list every day of the month on row(s) {shown}{more} "
            "(e.g. 30 days given for a 31-day month). It will be saved as given."
        )

    # ---- rows already in the table -------------------------------------
    existing = {"count": 0, "examples": [], "checked": True}
    target_meta = {"source": "mock", "reason": "not_configured"}
    if not errors:
        existing_rows, meta = await roster_repository.get_existing_rows()
        target_meta = {"source": meta["source"], "reason": meta["reason"]}
        if meta["reason"] == "connection_error":
            existing["checked"] = False
            warnings.append("Couldn't check the roster table for existing rows, so duplicates weren't checked.")
        else:
            present = set()
            for item in existing_rows:
                year = schema.year_number(item.get("year"))
                month = schema.month_number(item.get("month"))
                if year and month and item.get("emp_id"):
                    present.add((str(item.get("team_id", "")).lower(), str(item["emp_id"]).lower(), year, month))
            for clean in clean_rows:
                if schema.row_key(clean) in present:
                    existing["count"] += 1
                    if len(existing["examples"]) < MAX_EXISTING_EXAMPLES:
                        existing["examples"].append(
                            f"{clean['emp_id']} · {clean['team_id']} · {clean['month']} {clean['year']}"
                        )
            if existing["count"]:
                warnings.append(
                    f"{existing['count']} row(s) already exist in the roster table for the same team, employee and month. "
                    "Confirming will add new rows alongside them (existing rows are not changed or removed)."
                )
    else:
        from app.config import settings

        target_meta = {
            "source": "dynamodb" if settings.roster_configured else "mock",
            "reason": None if settings.roster_configured else "not_configured",
        }

    # ---- stage ----------------------------------------------------------
    can_commit = not errors and bool(clean_rows)
    upload_id = None
    if can_commit:
        upload_id = uuid.uuid4().hex
        stamp = _now()
        items = []
        for clean in clean_rows:
            item = {k: v for k, v in clean.items() if not k.startswith("_")}
            item["UID"] = uuid.uuid4().hex
            item["employee_id"] = item["emp_id"]  # the table carries both names for the same value
            item["created_on"] = item.get("created_on") or stamp
            item["updated_on"] = stamp
            item["updated_by"] = (uploaded_by or "").strip() or item.get("updated_by") or DEFAULT_UPDATED_BY
            items.append(item)
        _staged[upload_id] = {
            "created": time.time(),
            "items": items,
            "file_name": filename,
            "state": "staged",  # staged -> committing -> committed
            "result": None,
        }

    teams = Counter((c["team_id"], c.get("team_name", "")) for c in clean_rows)
    periods = sorted({f"{c['year']}-{schema.month_number(c['month']):02d}" for c in clean_rows})

    return {
        "upload_id": upload_id,
        "file_name": filename,
        "sheet_name": sheet.name,
        "header_row": header_idx + 1,
        "columns": columns_report,
        "total_rows": total_rows,
        "valid_rows": len(clean_rows) if not errors else 0,
        "error_count": len(errors),
        "errors": errors[:MAX_REPORTED_ISSUES],
        "warnings": warnings,
        "preview": [{f: c.get(f, "") for f in PREVIEW_FIELDS} for c in clean_rows[:PREVIEW_ROWS]],
        "preview_fields": PREVIEW_FIELDS,
        "summary": {
            "employees": len({c["emp_id"].lower() for c in clean_rows}),
            "teams": [
                {"team_id": team_id, "team_name": team_name, "rows": count}
                for (team_id, team_name), count in sorted(teams.items())
            ],
            "periods": periods,
        },
        "existing_rows": existing,
        "can_commit": can_commit,
        "target": target_meta,
    }


async def commit_upload(upload_id: str) -> dict:
    _purge_expired()
    staged = _staged.get(upload_id)
    if staged is None:
        raise UploadNotFoundError("This upload has expired or was already cleared. Attach the file again.")
    if staged["state"] == "committed":
        return {**staged["result"], "already_committed": True}
    if staged["state"] == "committing":
        raise UploadConflictError("This upload is already being written.")

    staged["state"] = "committing"
    try:
        written, meta = await roster_repository.put_rows(staged["items"])
    except RosterWriteError:
        staged["state"] = "staged"  # safe to retry: same UIDs overwrite what was already written
        raise

    result = {
        "written": written,
        "source": meta["source"],
        "reason": meta["reason"],
        "file_name": staged["file_name"],
    }
    staged["state"] = "committed"
    staged["result"] = result
    return {**result, "already_committed": False}
