import uuid

from django.db import models
from django.utils import timezone

from apps.accounts.models import CustomUser


class AttendanceRecord(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    school_class = models.ForeignKey(
        "classes.SchoolClass",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        db_column="class_id",
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices)
    marked_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="attendance_marked",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance_attendancerecord"
        ordering = ["-date", "student__full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "date"],
                name="unique_student_attendance_date",
            )
        ]

    def __str__(self):
        return f"{self.student.full_name} — {self.date} — {self.status}"


class AttendanceChangeLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name="change_logs",
    )
    changed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attendance_changes",
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "attendance_changelog"
        ordering = ["-changed_at"]


class TeacherAttendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"
        ON_LEAVE = "ON_LEAVE", "On Leave"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        "teachers.Teacher",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices)
    marked_by = models.ForeignKey(
        CustomUser,
        on_delete=models.PROTECT,
        related_name="teacher_attendance_marked",
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance_teacherattendance"
        ordering = ["-date", "teacher__user__full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["teacher", "date"],
                name="unique_teacher_attendance_date",
            )
        ]

    def __str__(self):
        return f"{self.teacher.full_name} — {self.date} — {self.status}"
