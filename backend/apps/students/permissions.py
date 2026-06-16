from rest_framework.permissions import BasePermission

from apps.accounts.models import CustomUser
from apps.students.models import StudentParent


class CanAccessStudent(BasePermission):
    """Admin, teacher of the student's class, or linked parent."""

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
            return teacher.assigned_class_id == obj.school_class_id
        if request.user.role == CustomUser.Role.PARENT:
            return StudentParent.objects.filter(
                student=obj, parent=request.user
            ).exists()
        return False
