import uuid

from django.db import models


class SchoolClass(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    grade = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    schedule = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "classes_schoolclass"
        verbose_name = "class"
        verbose_name_plural = "classes"
        ordering = ["grade", "section"]

    def __str__(self):
        return self.name
