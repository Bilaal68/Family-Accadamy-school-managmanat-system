import uuid

from django.db import models

from apps.accounts.models import CustomUser
from apps.students.models import Student


class StudentRemark(models.Model):
    class NoteType(models.TextChoices):
        REMARK = "REMARK", "Remark"
        BEHAVIOUR = "BEHAVIOUR", "Behaviour"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="remarks",
    )
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="student_remarks",
    )
    note_type = models.CharField(max_length=20, choices=NoteType.choices)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "behaviour_studentremark"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.note_type} — {self.student.full_name}"
