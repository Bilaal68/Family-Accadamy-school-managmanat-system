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
                fields=["student", "subject", "semester"],
                name="unique_student_subject_semester",
            )
        ]

    def __str__(self):
        return f"{self.student.full_name} — {self.subject} — {self.score}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Auto-calculate Final when both semesters exist
        if self.semester in [SemesterChoices.SEMESTER_1, SemesterChoices.SEMESTER_2]:
            self._update_final_mark()

    def _update_final_mark(self):
        # Get both semester marks for this student and subject
        sem1_mark = MarkEntry.objects.filter(
            student=self.student,
            subject=self.subject,
            semester=SemesterChoices.SEMESTER_1,
            approved_at__isnull=False,
        ).first()

        sem2_mark = MarkEntry.objects.filter(
            student=self.student,
            subject=self.subject,
            semester=SemesterChoices.SEMESTER_2,
            approved_at__isnull=False,
        ).first()

        # Only calculate Final if both semesters are approved
        if sem1_mark and sem2_mark:
            avg_score = (sem1_mark.score + sem2_mark.score) / Decimal("2")
            MarkEntry.objects.update_or_create(
                student=self.student,
                subject=self.subject,
                semester=SemesterChoices.FINAL,
                defaults={
                    "score": avg_score,
                    "submitted_by": sem1_mark.submitted_by,
                    "submitted_at": sem2_mark.submitted_at,
                    "approved_by": sem1_mark.approved_by,
                    "approved_at": sem2_mark.approved_at,
                },
            )
