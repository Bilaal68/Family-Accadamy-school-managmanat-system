from django.contrib import admin

from apps.classes.models import SchoolClass


@admin.register(SchoolClass)
class SchoolClassAdmin(admin.ModelAdmin):
    list_display = ("name", "grade", "section", "created_at")
    search_fields = ("name", "grade", "section")
