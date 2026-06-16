import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        CLASS_TEACHER = "CLASS_TEACHER", "Class Teacher"
        CASHIER = "CASHIER", "Cashier"
        PARENT = "PARENT", "Parent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=Role.choices)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        db_table = "accounts_customuser"
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self):
        return self.full_name

    @property
    def assigned_class(self):
        if self.role != self.Role.CLASS_TEACHER:
            return None
        try:
            school_class = self.teacher_profile.assigned_class
        except Exception:
            return None
        if school_class is None:
            return None
        return {"id": str(school_class.id), "name": school_class.name}
