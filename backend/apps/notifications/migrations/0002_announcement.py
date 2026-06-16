import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("classes", "0001_initial"),
        ("notifications", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Announcement",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("title", models.CharField(max_length=200)),
                ("message", models.TextField()),
                (
                    "audience",
                    models.CharField(
                        choices=[("ALL", "All School"), ("CLASS", "Class")],
                        max_length=10,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "school_class",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="announcements",
                        to="classes.schoolclass",
                    ),
                ),
                (
                    "sent_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="announcements_sent",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "notifications_announcement",
                "ordering": ["-created_at"],
            },
        ),
    ]
