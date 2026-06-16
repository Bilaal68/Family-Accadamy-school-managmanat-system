import io
from datetime import date

from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.mail import send_mail
from django.utils import timezone
from openpyxl import Workbook

from apps.attendance.models import AttendanceRecord
from apps.classes.models import SchoolClass
from apps.students.models import StudentParent


@shared_task
def export_attendance_task(class_id, date_from, date_to, requested_by_id):
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
    filename = (
        f"exports/attendance_{school_class.name}_{date_from}_{date_to}_"
        f"{timezone.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    )
    path = default_storage.save(filename, ContentFile(buffer.read()))
    return {"file_path": path, "class": school_class.name}


@shared_task
def send_attendance_to_parents_task(class_id, date_from, date_to):
    school_class = SchoolClass.objects.get(pk=class_id)
    records = AttendanceRecord.objects.filter(
        school_class_id=class_id,
        date__gte=date_from,
        date__lte=date_to,
        approved_at__isnull=False,
    ).select_related("student")

    sent = 0
    for record in records:
        links = StudentParent.objects.filter(
            student=record.student, is_primary=True
        ).select_related("parent")
        for link in links:
            parent = link.parent
            if not parent.email:
                continue
            send_mail(
                subject=f"Attendance Report — {record.student.full_name}",
                message=(
                    f"Dear {parent.full_name},\n\n"
                    f"Attendance for {record.student.full_name} on {record.date}:\n"
                    f"Status: {record.get_status_display()}\n\n"
                    f"Class: {school_class.name}\n"
                    f"— Family Academy"
                ),
                from_email=None,
                recipient_list=[parent.email],
                fail_silently=True,
            )
            sent += 1

    return {"emails_sent": sent, "class": school_class.name}
