from rest_framework.permissions import BasePermission

from apps.accounts.models import CustomUser


class IsAdminOrTeacherOfClass(BasePermission):
    """Admin or class teacher assigned to the requested class."""

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            try:
                teacher = request.user.teacher_profile
            except Exception:
                return False
            return teacher.assigned_class_id == obj.pk
        return False


class IsAdminOrTeacherOfClassOrParent(BasePermission):
    """Admin, teacher of class, or parent with a child in the class."""

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == CustomUser.Role.SUPER_ADMIN:
            return True
        if request.user.role == CustomUser.Role.CLASS_TEACHER:
            try:
                teacher = request.user.teacher_profile
            except Exception:
                return False
            return teacher.assigned_class_id == obj.pk
        if request.user.role == CustomUser.Role.PARENT:
            from apps.students.models import StudentParent

            return StudentParent.objects.filter(
                parent=request.user,
                student__school_class=obj,
            ).exists()
        return False
