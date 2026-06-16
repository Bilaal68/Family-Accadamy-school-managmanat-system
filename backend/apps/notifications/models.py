import uuid

from django.db import models

from apps.accounts.models import CustomUser


class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_notification"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} → {self.user.full_name}"


class Announcement(models.Model):
    class Audience(models.TextChoices):
        ALL_SCHOOL = "ALL", "All School"
        CLASS = "CLASS", "Class"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    message = models.TextField()
    audience = models.CharField(max_length=10, choices=Audience.choices)
    school_class = models.ForeignKey(
        "classes.SchoolClass",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )
    sent_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name="announcements_sent",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications_announcement"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
