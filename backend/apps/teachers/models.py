import uuid

from django.core.exceptions import ValidationError
from django.db import models

from apps.accounts.models import CustomUser


class Teacher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    assigned_class = models.OneToOneField(
        "classes.SchoolClass",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="class_teacher",
    )
    staff_id = models.CharField(max_length=20, unique=True, editable=False)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    photo = models.ImageField(upload_to="teachers/photos/", null=True, blank=True)
    qualification_document = models.FileField(upload_to="teachers/qualifications/", null=True, blank=True)
    joined_at = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "teachers_teacher"
        ordering = ["staff_id"]

    def __str__(self):
        return f"{self.staff_id} — {self.user.full_name}"

    def clean(self):
        super().clean()

        if self.user_id and self.user.role != CustomUser.Role.CLASS_TEACHER:
            raise ValidationError(
                {"user": "Linked user must have the CLASS_TEACHER role."}
            )

        if self.pk and self.assigned_class_id:
            previous_class_id = (
                Teacher.objects.filter(pk=self.pk)
                .values_list("assigned_class_id", flat=True)
                .first()
            )
            if previous_class_id and previous_class_id != self.assigned_class_id:
                raise ValidationError(
                    {
                        "assigned_class": (
                            "This teacher already has a class assigned. "
                            "Remove the current assignment before assigning a new class."
                        )
                    }
                )

        if self.assigned_class_id:
            conflict = Teacher.objects.filter(
                assigned_class_id=self.assigned_class_id
            ).exclude(pk=self.pk)
            if conflict.exists():
                raise ValidationError(
                    {"assigned_class": "This class already has a teacher assigned."}
                )

    def save(self, *args, **kwargs):
        if not self.staff_id:
            self.staff_id = self._generate_staff_id()
        self.full_clean()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_staff_id(cls) -> str:
        last = (
            cls.objects.filter(staff_id__startswith="TCH-")
            .order_by("-staff_id")
            .values_list("staff_id", flat=True)
            .first()
        )
        if not last:
            return "TCH-001"
        try:
            number = int(last.split("-")[1]) + 1
        except (IndexError, ValueError):
            number = cls.objects.count() + 1
        return f"TCH-{number:03d}"
