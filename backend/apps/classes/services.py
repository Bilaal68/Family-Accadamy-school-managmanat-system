from decimal import Decimal

from django.utils import timezone


def get_today_attendance_percentage(school_class) -> Decimal:
    """Return today's attendance % for a class."""
    from apps.attendance.models import AttendanceRecord

    today = timezone.localdate()
    records = AttendanceRecord.objects.filter(
        student__school_class=school_class,
        date=today,
    )
    total = records.count()
    if total == 0:
        return Decimal("0.00")
    present = records.filter(status=AttendanceRecord.Status.PRESENT).count()
    return Decimal(present * 100 / total).quantize(Decimal("0.01"))
