from django.contrib import admin

from apps.teachers.models import Teacher


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ("staff_id", "user", "assigned_class", "joined_at")
    search_fields = ("staff_id", "user__full_name", "user__email")
    raw_id_fields = ("user", "assigned_class")
