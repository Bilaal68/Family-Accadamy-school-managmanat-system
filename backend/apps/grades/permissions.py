from rest_framework.permissions import BasePermission

from apps.accounts.models import CustomUser
from apps.students.models import StudentParent


def _teacher_class_id(user):
    try:
        return user.teacher_profile.assigned_class_id
    except Exception:
        return None


class IsAdminOrTeacherMarking(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in (
            CustomUser.Role.SUPER_ADMIN,
            CustomUser.Role.CLASS_TEACHER,
        )


class IsTeacherOnly(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == CustomUser.Role.CLASS_TEACHER
        )


def filter_marks_queryset(queryset, user):
    if user.role == CustomUser.Role.SUPER_ADMIN:
        return queryset
    if user.role == CustomUser.Role.CLASS_TEACHER:
        class_id = _teacher_class_id(user)
        return queryset.filter(student__school_class_id=class_id)
    if user.role == CustomUser.Role.PARENT:
        child_ids = StudentParent.objects.filter(parent=user).values_list(
            "student_id", flat=True
        )
        return queryset.filter(
            student_id__in=child_ids,
            approved_at__isnull=False,
        )
    return queryset.none()


def can_access_student_mark(user, student):
    if user.role == CustomUser.Role.SUPER_ADMIN:
        return True
    if user.role == CustomUser.Role.CLASS_TEACHER:
        return _teacher_class_id(user) == student.school_class_id
    return False
