from rest_framework.permissions import BasePermission

from apps.accounts.models import CustomUser
from apps.students.models import StudentParent


def _teacher_class_id(user):
    try:
        return user.teacher_profile.assigned_class_id
    except Exception:
        return None


class IsAdminOrTeacherOfClass(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            class_id = view.kwargs.get("class_id") or request.data.get("class_id")
            if class_id:
                return str(_teacher_class_id(request.user)) == str(class_id)
            return _teacher_class_id(request.user) is not None
        return False


class IsAdminOrTeacherMarking(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in (
            CustomUser.Role.SUPER_ADMIN,
            CustomUser.Role.CLASS_TEACHER,
        )


class IsAdminOrTeacherOfRecord(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            return _teacher_class_id(request.user) == obj.school_class_id
        return False


class CanViewAttendance(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            return _teacher_class_id(request.user) == obj.school_class_id
        if request.user.role == CustomUser.Role.PARENT:
            linked = StudentParent.objects.filter(
                student=obj.student, parent=request.user
            ).exists()
            return linked and obj.approved_at is not None
        return False


def filter_attendance_queryset(queryset, user):
    if user.role == CustomUser.Role.SUPER_ADMIN:
        return queryset
    if user.role == CustomUser.Role.CLASS_TEACHER:
        class_id = _teacher_class_id(user)
        return queryset.filter(school_class_id=class_id)
    if user.role == CustomUser.Role.PARENT:
        child_ids = StudentParent.objects.filter(parent=user).values_list(
            "student_id", flat=True
        )
        return queryset.filter(
            student_id__in=child_ids,
            approved_at__isnull=False,
        )
    return queryset.none()
