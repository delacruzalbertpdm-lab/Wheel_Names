"""
CSV and Excel (.xlsx) batch participant import service.
Supports flexible column headers (e.g. 'name', 'full_name', 'participant',
'email', 'department', 'team', 'group') or single-column name lists.
"""

import csv
import io
from typing import Dict, Any, List, Tuple
import openpyxl
from django.db import transaction
from core.models import Participant, pick_avatar_color


NAME_HEADERS = {'name', 'full_name', 'fullname', 'participant', 'player', 'player_name', 'employee', 'member'}
EMAIL_HEADERS = {'email', 'e-mail', 'email_address', 'mail'}
DEPT_HEADERS = {'department', 'dept', 'team', 'group', 'role', 'division', 'category'}


def _normalize_header(value: Any) -> str:
    if value is None:
        return ''
    return str(value).strip().lower().replace(' ', '_')


def _extract_rows_from_csv(file_bytes: bytes) -> List[List[str]]:
    try:
        text = file_bytes.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = file_bytes.decode('latin-1')

    reader = csv.reader(io.StringIO(text))
    return [[cell.strip() for cell in row] for row in reader if any(cell.strip() for cell in row)]


def _extract_rows_from_xlsx(file_bytes: bytes) -> List[List[str]]:
    workbook = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), read_only=True, data_only=True)
    sheet = workbook.active
    rows: List[List[str]] = []
    for row in sheet.iter_rows(values_only=True):
        cleaned = [str(cell).strip() if cell is not None else '' for cell in row]
        if any(cleaned):
            rows.append(cleaned)
    workbook.close()
    return rows


def _parse_structured_rows(rows: List[List[str]]) -> List[Dict[str, str]]:
    if not rows:
        return []

    first_row_norm = [_normalize_header(c) for c in rows[0]]
    name_idx = None
    email_idx = None
    dept_idx = None

    for idx, col_name in enumerate(first_row_norm):
        if name_idx is None and col_name in NAME_HEADERS:
            name_idx = idx
        elif email_idx is None and col_name in EMAIL_HEADERS:
            email_idx = idx
        elif dept_idx is None and col_name in DEPT_HEADERS:
            dept_idx = idx

    has_header = name_idx is not None
    if not has_header:
        # Assume column 0 is full_name, optional column 1 is department or email
        name_idx = 0
        if len(rows[0]) > 1:
            second_val = rows[0][1]
            if '@' in second_val:
                email_idx = 1
                dept_idx = 2 if len(rows[0]) > 2 else None
            else:
                dept_idx = 1
                email_idx = 2 if len(rows[0]) > 2 else None
        data_rows = rows
    else:
        data_rows = rows[1:]

    parsed: List[Dict[str, str]] = []
    for row in data_rows:
        if name_idx >= len(row):
            continue
        full_name = row[name_idx].strip()
        if not full_name:
            continue
        email = row[email_idx].strip() if (email_idx is not None and email_idx < len(row)) else ''
        department = row[dept_idx].strip() if (dept_idx is not None and dept_idx < len(row)) else 'General'
        parsed.append({
            'full_name': full_name[:150],
            'email': email[:254] if '@' in email else '',
            'department': (department or 'General')[:100],
        })
    return parsed


def import_participants_from_file(uploaded_file) -> Tuple[int, int, List[Participant]]:
    """
    Parses a CSV or Excel (.xlsx) file and bulk-creates non-duplicate participants.
    Returns (created_count, skipped_duplicates_count, created_participants).
    """
    filename = (uploaded_file.name or '').lower()
    file_bytes = uploaded_file.read()

    if filename.endswith('.xlsx'):
        raw_rows = _extract_rows_from_xlsx(file_bytes)
    elif filename.endswith('.csv') or filename.endswith('.txt'):
        raw_rows = _extract_rows_from_csv(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")

    candidates = _parse_structured_rows(raw_rows)
    if not candidates:
        raise ValueError("No valid participant rows were found in the uploaded file.")

    with transaction.atomic():
        existing_names = {
            name.strip().lower()
            for name in Participant.objects.values_list('full_name', flat=True)
        }

        to_create: List[Participant] = []
        skipped_count = 0

        for item in candidates:
            normalized_name = item['full_name'].strip().lower()
            if normalized_name in existing_names:
                skipped_count += 1
                continue
            existing_names.add(normalized_name)
            to_create.append(
                Participant(
                    full_name=item['full_name'].strip(),
                    email=item['email'],
                    department=item['department'] or 'General',
                    avatar_color=pick_avatar_color(item['full_name'].strip()),
                    is_eligible=True,
                )
            )

        created_records = Participant.objects.bulk_create(to_create)
        return len(created_records), skipped_count, created_records

