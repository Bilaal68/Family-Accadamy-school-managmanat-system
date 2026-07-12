from decimal import Decimal

import uuid
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from apps.accounts.models import CustomUser


class SemesterChoices(models.TextChoices):
    SEMESTER_1 = "SEMESTER_1", "Semester 1"
    SEMESTER_2 = "SEMESTER_2", "Semester 2"
    FINAL = "FINAL", "Final"


class AssessmentTypeChoices(models.TextChoices):
    """Types of assessments that can be recorded"""
    TEST = "TEST", "Test"
    QUIZ = "QUIZ", "Quiz"
    ASSIGNMENT = "ASSIGNMENT", "Assignment"
    PROJECT = "PROJECT", "Project"
    MID_EXAM = "MID_EXAM", "Mid Exam"
    FINAL_EXAM = "FINAL_EXAM", "Final Exam"
    HOMEWORK = "HOMEWORK", "Homework"
    PARTICIPATION = "PARTICIPATION", "Class Participation"
    OTHER = "OTHER", "Other"


class Subject(models.Model):
    """Subject model to persist subjects in database"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subjects_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "grades_subject"
        ordering = ["name"]

    def __str__(self):
        return self.name


class MarkEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="mark_entries",
    )
    subject = models.CharField(max_length=100)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    semester = models.CharField(
        max_length=50,
        choices=SemesterChoices.choices,
    )
    assessment_type = models.CharField(
        max_length=50,
        choices=AssessmentTypeChoices.choices,
        default=AssessmentTypeChoices.TEST,
    )
    remarks = models.TextField(blank=True, null=True)
    submitted_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="marks_submitted",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marks_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "grades_markentry"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "subject", "semester", "assessment_type"],
                name="unique_student_subject_semester_assessment",
            )
        ]

    def __str__(self):
        return f"{self.student.full_name} — {self.subject} — {self.get_assessment_type_display()} — {self.score}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
