import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("students", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentRemark",
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
                (
                    "note_type",
                    models.CharField(
                        choices=[
                            ("REMARK", "Remark"),
                            ("BEHAVIOUR", "Behaviour"),
                        ],
                        max_length=20,
                    ),
                ),
                ("content", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "author",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="student_remarks",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "student",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="remarks",
                        to="students.student",
                    ),
                ),
            ],
            options={
                "db_table": "behaviour_studentremark",
                "ordering": ["-created_at"],
            },
        ),
    ]
