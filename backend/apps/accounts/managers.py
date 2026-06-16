from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    def create_user(
        self,
        email=None,
        phone=None,
        password=None,
        full_name="",
        role=None,
        **extra_fields,
    ):
        if not email and not phone:
            raise ValueError("User must have either an email or a phone number.")
        if not full_name:
            raise ValueError("User must have a full name.")
        if not role:
            raise ValueError("User must have a role.")

        email = self.normalize_email(email) if email else None
        user = self.model(
            email=email,
            phone=phone,
            full_name=full_name,
            role=role,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", self.model.Role.SUPER_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(
            email=email,
            password=password,
            full_name=extra_fields.pop("full_name", "Super Admin"),
            role=extra_fields.pop("role", self.model.Role.SUPER_ADMIN),
            **extra_fields,
        )
