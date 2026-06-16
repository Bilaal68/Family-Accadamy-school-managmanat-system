from django.contrib import admin

from apps.grades.models import MarkEntry


@admin.register(MarkEntry)
class MarkEntryAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "subject",
        "score",
        "semester",
        "submitted_at",
        "approved_at",
    )
    list_filter = ("semester", "subject")
    search_fields = ("student__full_name", "student__student_id")
    raw_id_fields = ("student", "submitted_by", "approved_by")
