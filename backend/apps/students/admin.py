from django.contrib import admin

from apps.students.models import Student, StudentDeletionLog, StudentParent


class StudentParentInline(admin.TabularInline):
    model = StudentParent
    extra = 0
    raw_id_fields = ("parent",)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        "student_id",
        "full_name",
        "school_class",
        "gender",
        "is_active",
        "enrolled_at",
    )
    list_filter = ("school_class", "gender", "is_active")
    search_fields = ("student_id", "full_name")
    readonly_fields = ("student_id", "enrolled_at", "created_at", "updated_at")
    inlines = [StudentParentInline]


@admin.register(StudentParent)
class StudentParentAdmin(admin.ModelAdmin):
    list_display = ("student", "parent", "relationship", "is_primary", "linked_at")
    raw_id_fields = ("student", "parent")


@admin.register(StudentDeletionLog)
class StudentDeletionLogAdmin(admin.ModelAdmin):
    list_display = ("student_code", "full_name", "deleted_by", "deleted_at")
    readonly_fields = ("deleted_at",)
