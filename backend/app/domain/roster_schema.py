"""Roster upload schema: the agreed sheet columns, tolerant header matching,
and per-row validation. Pure functions — no I/O — so they're easy to test.

The agreed sheet (17 columns):

    Team ID, Team Name, Team Email ID, Emp ID, Employee Name, Employee Email,
    Year, Month, Days_Availability, Level, Shift, Shift Start Time,
    Shift End Time, Active, Created On, Updated On, Updated By

One row = one employee for one month. Headers are matched tolerantly (case,
spacing, underscores, common aliases, then close misspellings) but values are
never guessed at: anything we can't confidently read is reported as an error.
"""

from __future__ import annotations

import calendar
import json
import re
from dataclasses import dataclass
from datetime import datetime
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Tuple


@dataclass(frozen=True)
class Column:
    header: str  # canonical header as written in the agreed sheet
    field: str  # DynamoDB attribute name
    required: bool = False
    aliases: Tuple[str, ...] = ()  # already-normalized alternative spellings


COLUMNS: Tuple[Column, ...] = (
    Column("Team ID", "team_id", True, ("teamcode", "teamidentifier")),
    Column("Team Name", "team_name"),
    Column("Team Email ID", "team_email_id", False, ("teamemail", "teamemailaddress", "teammail", "teammailid")),
    Column("Emp ID", "emp_id", True, ("employeeid", "empno", "empnumber", "employeenumber", "empcode", "employeecode")),
    Column("Employee Name", "employee_name", True, ("empname", "name", "fullname", "employeefullname")),
    Column(
        "Employee Email",
        "employee_email",
        False,
        ("employeeemailid", "employeeemailaddress", "empemail", "empemailid", "email", "emailid", "emailaddress", "mailid"),
    ),
    Column("Year", "year", True, ("yr", "rosteryear")),
    Column("Month", "month", True, ("mon", "rostermonth")),
    Column("Days_Availability", "days_availability", False, ("availability", "daysavailable", "availabledays", "availabilitydays")),
    Column("Level", "level", False, ("lvl", "supportlevel")),
    Column("Shift", "shift", False, ("shifttype", "shiftname")),
    Column("Shift Start Time", "shift_start_time", False, ("shiftstart", "starttime", "shiftfrom")),
    Column("Shift End Time", "shift_end_time", False, ("shiftend", "endtime", "shiftto")),
    Column("Active", "active", False, ("isactive", "activeflag")),
    Column("Created On", "created_on", False, ("createddate", "createdat", "createdtime")),
    Column("Updated On", "updated_on", False, ("updateddate", "updatedat", "modifiedon", "lastupdated", "lastupdatedon")),
    Column("Updated By", "updated_by", False, ("modifiedby", "lastupdatedby")),
)

COLUMN_BY_FIELD: Dict[str, Column] = {c.field: c for c in COLUMNS}

FUZZY_MIN_RATIO = 0.85
FUZZY_MIN_MARGIN = 0.05
MIN_HEADERS_FOR_HEADER_ROW = 3  # how many columns a row must match to count as the header row


def normalize_header(value: object) -> str:
    """'Days_Availability ' / 'days availability' / 'DAYS-AVAILABILITY' -> 'daysavailability'."""
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


_CANONICAL_NORM: Dict[str, Column] = {normalize_header(c.header): c for c in COLUMNS}
_ALIAS_NORM: Dict[str, Column] = {a: c for c in COLUMNS for a in c.aliases}


# --------------------------------------------------------------------------
# Header matching
# --------------------------------------------------------------------------


@dataclass
class ColumnMatch:
    column: Column
    index: Optional[int] = None  # position in the header row; None = not found
    found_as: Optional[str] = None  # the header text as it appears in the file
    kind: str = "missing"  # exact | alias | fuzzy | missing


@dataclass
class HeaderMatch:
    matches: List[ColumnMatch]
    ignored: List[str]  # file headers that matched no expected column

    @property
    def matched_count(self) -> int:
        return sum(1 for m in self.matches if m.index is not None)

    def by_field(self) -> Dict[str, ColumnMatch]:
        return {m.column.field: m for m in self.matches}


def match_headers(headers: List[str]) -> HeaderMatch:
    """Map file headers onto the expected columns.

    Three passes, each only using headers/columns not already claimed, so a
    surer match always beats a looser one:
      1. exact once case/spacing/punctuation are ignored  ("emp_id" == "Emp ID")
      2. known aliases                                     ("Employee ID" -> Emp ID)
      3. close misspellings, only if clearly better than the runner-up
    """
    norms = [normalize_header(h) for h in headers]
    result: Dict[str, ColumnMatch] = {c.field: ColumnMatch(c) for c in COLUMNS}
    claimed_sources: set = set()

    def claim(idx: int, column: Column, kind: str) -> None:
        match = result[column.field]
        match.index, match.found_as, match.kind = idx, str(headers[idx]).strip(), kind
        claimed_sources.add(idx)

    for idx, norm in enumerate(norms):
        column = _CANONICAL_NORM.get(norm)
        if norm and column and result[column.field].index is None:
            claim(idx, column, "exact")

    for idx, norm in enumerate(norms):
        if idx in claimed_sources:
            continue
        column = _ALIAS_NORM.get(norm)
        if norm and column and result[column.field].index is None:
            claim(idx, column, "alias")

    for idx, norm in enumerate(norms):
        if idx in claimed_sources or len(norm) < 4:
            continue
        scored = sorted(
            ((SequenceMatcher(None, norm, canon).ratio(), column) for canon, column in _CANONICAL_NORM.items()),
            key=lambda pair: pair[0],
            reverse=True,
        )
        best_ratio, best_column = scored[0]
        runner_up = scored[1][0] if len(scored) > 1 else 0.0
        if (
            best_ratio >= FUZZY_MIN_RATIO
            and best_ratio - runner_up >= FUZZY_MIN_MARGIN
            and result[best_column.field].index is None
        ):
            claim(idx, best_column, "fuzzy")

    ignored = [
        str(headers[i]).strip()
        for i in range(len(headers))
        if i not in claimed_sources and str(headers[i]).strip()
    ]
    return HeaderMatch([result[c.field] for c in COLUMNS], ignored)


def find_header_row(rows: List[List[str]], search_rows: int = 15) -> Optional[Tuple[int, HeaderMatch]]:
    """Index (0-based) and match of the best header row near the top of the sheet.

    Allows for title rows or blank lines above the real header. Returns None if
    no row matches at least MIN_HEADERS_FOR_HEADER_ROW expected columns.
    """
    best: Optional[Tuple[int, HeaderMatch]] = None
    for i, row in enumerate(rows[:search_rows]):
        if not any(str(c).strip() for c in row):
            continue
        candidate = match_headers(row)
        if candidate.matched_count < MIN_HEADERS_FOR_HEADER_ROW:
            continue
        if best is None or candidate.matched_count > best[1].matched_count:
            best = (i, candidate)
    return best


# --------------------------------------------------------------------------
# Row validation
# --------------------------------------------------------------------------

_EMAIL = re.compile(r"^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$")
_TRUTHY = {"true", "yes", "y", "1", "active"}
_FALSY = {"false", "no", "n", "0", "inactive"}

_MONTHS = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
]
_MONTH_LOOKUP = {name: i + 1 for i, name in enumerate(_MONTHS)}
_MONTH_LOOKUP.update({name[:3]: i + 1 for i, name in enumerate(_MONTHS)})
_MONTH_LOOKUP["sept"] = 9

MAX_FIELD_CHARS = 200
MAX_AVAILABILITY_CHARS = 2000  # a full month of {"1": "Y", ...} is ~250 chars


def month_number(value: object) -> Optional[int]:
    """1-12 from '10', '10.0', 'Oct', 'October' (any case); None if not a month."""
    text = str(value or "").strip().lower().rstrip(".")
    if not text:
        return None
    if re.fullmatch(r"\d{1,2}(\.0+)?", text):
        number = int(float(text))
        return number if 1 <= number <= 12 else None
    return _MONTH_LOOKUP.get(text)


def year_number(value: object) -> Optional[int]:
    text = str(value or "").strip()
    if re.fullmatch(r"\d{4}(\.0+)?", text):
        number = int(float(text))
        return number if 2000 <= number <= 2100 else None
    return None


def parse_time(value: str) -> Optional[str]:
    """'9:00', '09:00:00', '9 AM', '9:30 pm' -> 'HH:MM' (24h); None if unreadable."""
    text = value.strip().lower().replace(".", "")
    if not text:
        return None
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M%p", "%I %p", "%I%p", "%I:%M:%S %p"):
        try:
            return datetime.strptime(text, fmt).strftime("%H:%M")
        except ValueError:
            continue
    return None


def normalize_active(value: str) -> Optional[str]:
    """'Yes'/'No' (the real table stores the strings); None if unrecognised. Blank -> 'Yes'."""
    text = value.strip().lower()
    if not text:
        return "Yes"
    if text in _TRUTHY:
        return "Yes"
    if text in _FALSY:
        return "No"
    return None


def parse_availability(value: str) -> Tuple[Optional[Dict[str, str]], Optional[str]]:
    """Days_Availability is a JSON object of day -> "Y"/"N", e.g. {"1": "Y", "2": "N", ...}.

    Returns (normalized map, None) or (None, reason). Keys must be days 1-31;
    values are case-insensitive Y/N and are normalized to upper case.
    """
    try:
        parsed = json.loads(value)
    except ValueError:
        return None, 'is not valid JSON (expected e.g. {"1": "Y", "2": "N", ...})'
    if not isinstance(parsed, dict) or not parsed:
        return None, 'must be a JSON object of day -> Y/N (e.g. {"1": "Y", "2": "N"})'

    normalized: Dict[str, str] = {}
    for day, flag in parsed.items():
        if not re.fullmatch(r"\d{1,2}", str(day)) or not 1 <= int(day) <= 31:
            return None, f"has an invalid day '{day}' (days must be 1-31)"
        if str(flag).strip().upper() not in ("Y", "N"):
            return None, f"day {day} is '{flag}' — each day must be Y or N"
        normalized[str(int(day))] = str(flag).strip().upper()
    return normalized, None


def days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]


def row_key(clean: Dict[str, str]) -> Tuple[str, str, int, int]:
    """Identity of a roster row: (team, employee, year, month)."""
    return (
        clean["team_id"].lower(),
        clean["emp_id"].lower(),
        int(year_number(clean["year"]) or 0),
        int(month_number(clean["month"]) or 0),
    )


def validate_row(raw: Dict[str, str]) -> Tuple[Dict[str, str], List[Tuple[str, str]]]:
    """Validate and tidy one row. `raw` maps field -> cell text ('' if absent).

    Returns (clean_row, [(field, message), ...]). Values are only trimmed and
    format-checked — never re-interpreted — except Active ("Yes"/"No") and
    shift times ("HH:MM"), which have one unambiguous canonical form.
    """
    clean = {f: str(v).strip() for f, v in raw.items()}
    errors: List[Tuple[str, str]] = []

    for column in COLUMNS:
        value = clean.get(column.field, "")
        limit = MAX_AVAILABILITY_CHARS if column.field == "days_availability" else MAX_FIELD_CHARS
        if column.required and not value:
            errors.append((column.field, "is required"))
        elif len(value) > limit:
            errors.append((column.field, f"is too long (max {limit} characters)"))

    availability = clean.get("days_availability", "")
    if availability and len(availability) <= MAX_AVAILABILITY_CHARS:
        days, problem = parse_availability(availability)
        if problem:
            errors.append(("days_availability", problem))
        else:
            # Same layout as the source sheet: {"1": "Y", "2": "N", ...}
            clean["days_availability"] = json.dumps(days)

    if clean.get("year") and year_number(clean["year"]) is None:
        errors.append(("year", f"'{clean['year']}' is not a valid year (expected e.g. 2026)"))
    if clean.get("month") and month_number(clean["month"]) is None:
        errors.append(("month", f"'{clean['month']}' is not a valid month (use 1-12 or a month name)"))

    for field in ("team_email_id", "employee_email"):
        value = clean.get(field, "")
        if not value:
            continue
        # Team mailboxes are sometimes listed as "a@x.com; b@x.com".
        parts = [p.strip() for p in re.split(r"[;,]", value) if p.strip()]
        bad = [p for p in parts if not _EMAIL.match(p)]
        if field == "employee_email" and len(parts) > 1:
            errors.append((field, "should contain a single email address"))
        elif bad:
            errors.append((field, f"'{bad[0]}' is not a valid email address"))

    for field in ("shift_start_time", "shift_end_time"):
        value = clean.get(field, "")
        if value:
            parsed = parse_time(value)
            if parsed is None:
                errors.append((field, f"'{value}' is not a valid time (expected e.g. 09:00 or 9:00 AM)"))
            else:
                clean[field] = parsed

    active = normalize_active(clean.get("active", ""))
    if active is None:
        errors.append(("active", f"'{clean['active']}' is not recognised (use Yes/No)"))
    else:
        clean["active"] = active

    return clean, errors
