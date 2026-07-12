from django.contrib import admin

from apps.grades.models import MarkEntry, Subject


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "created_by", "is_active", "created_at")
    list_filter = ("is_active", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at", "updated_at")


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
