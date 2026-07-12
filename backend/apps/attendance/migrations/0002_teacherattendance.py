# Generated migration for TeacherAttendance model

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0001_initial'),
        ('teachers', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TeacherAttendance',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('status', models.CharField(choices=[('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('LATE', 'Late'), ('ON_LEAVE', 'On Leave')], max_length=20)),
                ('notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('marked_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='teacher_attendance_marked', to=settings.AUTH_USER_MODEL)),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_records', to='teachers.teacher')),
            ],
            options={
                'db_table': 'attendance_teacherattendance',
                'ordering': ['-date', 'teacher__user__full_name'],
            },
        ),
        migrations.AddConstraint(
            model_name='teacherattendance',
            constraint=models.UniqueConstraint(fields=('teacher', 'date'), name='unique_teacher_attendance_date'),
        ),
    ]
