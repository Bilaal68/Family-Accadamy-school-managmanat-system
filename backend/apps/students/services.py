import csv
import io
from datetime import datetime

from django.utils.dateparse import parse_date
from openpyxl import load_workbook

from apps.classes.models import SchoolClass
from apps.students.models import Student

BULK_REQUIRED_COLUMNS = ("full_name", "date_of_birth", "gender", "class_id")
VALID_GENDERS = {choice for choice, _ in Student.Gender.choices}


def _normalize_header(value):
    if value is None:
        return ""
    return str(value).strip().lower().replace(" ", "_")


def _parse_row(row_dict, row_number):
    full_name = (row_dict.get("full_name") or "").strip()
    dob_raw = (row_dict.get("date_of_birth") or "").strip()
    if hasattr(dob_raw, "strftime"):
        dob_raw = dob_raw.strftime("%Y-%m-%d")
    else:
        dob_raw = str(dob_raw).strip()
    gender = (row_dict.get("gender") or "").strip().upper()
    class_id = str(row_dict.get("class_id") or "").strip()

    if not full_name:
        return None, {"row": row_number, "reason": "full_name is required."}
    if not dob_raw:
        return None, {"row": row_number, "reason": "date_of_birth is required."}
    if not gender:
        return None, {"row": row_number, "reason": "gender is required."}
    if gender not in VALID_GENDERS:
        return None, {
            "row": row_number,
            "reason": f"gender must be one of: {', '.join(sorted(VALID_GENDERS))}.",
        }
    if not class_id:
        return None, {"row": row_number, "reason": "class_id is required."}

    date_of_birth = parse_date(dob_raw)
    if date_of_birth is None:
        try:
            date_of_birth = datetime.strptime(dob_raw, "%d/%m/%Y").date()
        except ValueError:
            return None, {
                "row": row_number,
                "reason": "date_of_birth must be YYYY-MM-DD or DD/MM/YYYY.",
            }

    try:
        school_class = SchoolClass.objects.get(pk=class_id)
    except (SchoolClass.DoesNotExist, ValueError):
        return None, {"row": row_number, "reason": "class_id is invalid or not found."}

    return {
        "full_name": full_name,
        "date_of_birth": date_of_birth,
        "gender": gender,
        "school_class": school_class,
    }, None


def _validate_headers(headers):
    missing = [col for col in BULK_REQUIRED_COLUMNS if col not in headers]
    if missing:
        return f"Missing required columns: {', '.join(missing)}."
    return None


def _rows_from_csv(file_obj):
    content = file_obj.read()
    if isinstance(content, bytes):
        content = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        return [], "CSV file has no header row."
    headers = [_normalize_header(h) for h in reader.fieldnames]
    error = _validate_headers(headers)
    if error:
        return [], error

    rows = []
    for index, raw in enumerate(reader, start=2):
        row_dict = {_normalize_header(k): (v or "") for k, v in raw.items()}
        rows.append((index, row_dict))
    return rows, None


def _rows_from_excel(file_obj):
    workbook = load_workbook(filename=io.BytesIO(file_obj.read()), read_only=True)
    sheet = workbook.active
    rows_iter = sheet.iter_rows(values_only=True)
    try:
        header_row = next(rows_iter)
    except StopIteration:
        return [], "Excel file is empty."

    headers = [_normalize_header(cell) for cell in header_row]
    error = _validate_headers(headers)
    if error:
        return [], error

    rows = []
    for index, values in enumerate(rows_iter, start=2):
        if not any(values):
            continue
        row_dict = {
            headers[i]: (values[i] if i < len(values) and values[i] is not None else "")
            for i in range(len(headers))
        }
        rows.append((index, row_dict))
    return rows, None


def process_bulk_upload(uploaded_file):
    filename = (uploaded_file.name or "").lower()
    if filename.endswith(".csv"):
        rows, error = _rows_from_csv(uploaded_file)
    elif filename.endswith((".xlsx", ".xlsm", ".xltx")):
        rows, error = _rows_from_excel(uploaded_file)
    else:
        return {
            "success_count": 0,
            "failed_rows": [{"row": 0, "reason": "Upload a .csv or .xlsx file."}],
        }

    if error:
        return {"success_count": 0, "failed_rows": [{"row": 0, "reason": error}]}

    success_count = 0
    failed_rows = []

    for row_number, row_dict in rows:
        parsed, failure = _parse_row(row_dict, row_number)
        if failure:
            failed_rows.append(failure)
            continue
        Student.objects.create(**parsed)
        success_count += 1

    return {"success_count": success_count, "failed_rows": failed_rows}
