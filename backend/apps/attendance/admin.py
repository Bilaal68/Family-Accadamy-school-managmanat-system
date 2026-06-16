from django.contrib import admin

from apps.attendance.models import AttendanceChangeLog, AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "school_class",
        "date",
        "status",
        "submitted_at",
        "approved_at",
    )
    list_filter = ("status", "date", "school_class")
    search_fields = ("student__full_name", "student__student_id")
    raw_id_fields = ("student", "school_class", "marked_by", "approved_by")


@admin.register(AttendanceChangeLog)
class AttendanceChangeLogAdmin(admin.ModelAdmin):
    list_display = ("attendance_record", "old_status", "new_status", "changed_by", "changed_at")
    readonly_fields = ("changed_at",)
