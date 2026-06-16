import uuid

from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.accounts.models import CustomUser


class Student(models.Model):
    class Gender(models.TextChoices):
        MALE = "M", "Male"
        FEMALE = "F", "Female"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_id = models.CharField(max_length=20, unique=True, editable=False)
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=Gender.choices)
    photo = models.ImageField(upload_to="students/photos/", null=True, blank=True)
    school_class = models.ForeignKey(
        "classes.SchoolClass",
        on_delete=models.PROTECT,
        related_name="students",
        db_column="class_id",
    )
    enrolled_at = models.DateField(default=timezone.localdate, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "students_student"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.student_id} — {self.full_name}"

    def save(self, *args, **kwargs):
        if not self.student_id:
            self.student_id = self._generate_student_id()
        if not self.enrolled_at:
            self.enrolled_at = timezone.localdate()
        super().save(*args, **kwargs)

    @classmethod
    def _generate_student_id(cls) -> str:
        last = (
            cls.objects.filter(student_id__startswith="STU-")
            .order_by("-student_id")
            .values_list("student_id", flat=True)
            .first()
        )
        if not last:
            return "STU-00001"
        try:
            number = int(last.split("-")[1]) + 1
        except (IndexError, ValueError):
            number = cls.objects.count() + 1
        return f"STU-{number:05d}"

    @property
    def overall_average(self):
        from django.db.models import Avg

        from apps.grades.models import MarkEntry

        result = MarkEntry.objects.filter(
            student=self, approved_at__isnull=False
        ).aggregate(avg=Avg("score"))
        return result["avg"] or 0


class StudentParent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="parent_links",
    )
    parent = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="student_links",
        limit_choices_to={"role": CustomUser.Role.PARENT},
    )
    relationship = models.CharField(max_length=50)
    is_primary = models.BooleanField(default=False)
    linked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "students_studentparent"
        constraints = [
            models.UniqueConstraint(
                fields=["student", "parent"],
                name="unique_student_parent_link",
            )
        ]

    def __str__(self):
        return f"{self.parent.full_name} → {self.student.full_name}"

    def clean(self):
        super().clean()
        if self.parent_id and self.parent.role != CustomUser.Role.PARENT:
            raise ValidationError({"parent": "Linked user must have the PARENT role."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.is_primary:
            StudentParent.objects.filter(student=self.student).exclude(
                pk=self.pk
            ).update(is_primary=False)


class StudentDeletionLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_uuid = models.UUIDField()
    student_code = models.CharField(max_length=20)
    full_name = models.CharField(max_length=255)
    deleted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="student_deletions",
    )
    deleted_at = models.DateTimeField(auto_now_add=True)
    snapshot = models.JSONField(default=dict)

    class Meta:
        db_table = "students_deletion_log"
        ordering = ["-deleted_at"]
