from django.contrib import admin

from apps.attendance.models import AttendanceChangeLog, AttendanceRecord, TeacherAttendance


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


@admin.register(TeacherAttendance)
class TeacherAttendanceAdmin(admin.ModelAdmin):
    list_display = ("teacher", "date", "status", "marked_by", "created_at")
    list_filter = ("status", "date")
    search_fields = ("teacher__full_name", "teacher__staff_id")
    raw_id_fields = ("teacher", "marked_by")
    readonly_fields = ("created_at", "updated_at")
