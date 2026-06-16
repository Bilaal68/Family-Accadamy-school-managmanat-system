import io
from datetime import date

from django.core.files.base import ContentFile
from django.utils import timezone
from openpyxl import Workbook

from apps.attendance.models import AttendanceRecord
from apps.classes.models import SchoolClass


def build_attendance_export(class_id, date_from: date, date_to: date):
    school_class = SchoolClass.objects.get(pk=class_id)
    records = AttendanceRecord.objects.filter(
        school_class_id=class_id,
        date__gte=date_from,
        date__lte=date_to,
    ).select_related("student")

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Attendance"
    sheet.append(
        [
            "Student ID",
            "Student Name",
            "Date",
            "Status",
            "Submitted At",
            "Approved At",
        ]
    )
    for record in records:
        sheet.append(
            [
                record.student.student_id,
                record.student.full_name,
                str(record.date),
                record.status,
                str(record.submitted_at or ""),
                str(record.approved_at or ""),
            ]
        )

    buffer = io.BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    safe_name = school_class.name.replace(" ", "_")
    filename = f"attendance_{safe_name}_{date_from}_{date_to}.xlsx"
    return buffer, filename, school_class.name
