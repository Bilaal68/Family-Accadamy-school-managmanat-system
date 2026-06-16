from rest_framework.permissions import BasePermission

from .models import CustomUser


class IsAdmin(BasePermission):
    """Only allows SUPER_ADMIN role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == CustomUser.Role.SUPER_ADMIN
        )


class IsTeacher(BasePermission):
    """Only allows CLASS_TEACHER role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == CustomUser.Role.CLASS_TEACHER
        )


class IsParent(BasePermission):
    """Only allows PARENT role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == CustomUser.Role.PARENT
        )


class IsCashier(BasePermission):
    """Only allows CASHIER role."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == CustomUser.Role.CASHIER
        )


class IsAdminOrCashier(BasePermission):
    """Allows SUPER_ADMIN or CASHIER roles."""

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in [CustomUser.Role.SUPER_ADMIN, CustomUser.Role.CASHIER]
        )
