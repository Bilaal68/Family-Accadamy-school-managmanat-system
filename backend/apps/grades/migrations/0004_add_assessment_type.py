# Generated migration for adding assessment_type field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0003_subject'),
    ]

    operations = [
        # Remove old unique constraint
        migrations.RemoveConstraint(
            model_name='markentry',
            name='unique_student_subject_semester',
        ),
        # Add assessment_type field
        migrations.AddField(
            model_name='markentry',
            name='assessment_type',
            field=models.CharField(
                choices=[
                    ('TEST', 'Test'),
                    ('QUIZ', 'Quiz'),
                    ('ASSIGNMENT', 'Assignment'),
                    ('PROJECT', 'Project'),
                    ('MID_EXAM', 'Mid Exam'),
                    ('FINAL_EXAM', 'Final Exam'),
                    ('HOMEWORK', 'Homework'),
                    ('PARTICIPATION', 'Class Participation'),
                    ('OTHER', 'Other'),
                ],
                default='TEST',
                max_length=50,
            ),
        ),
        # Add new unique constraint including assessment_type
        migrations.AddConstraint(
            model_name='markentry',
            constraint=models.UniqueConstraint(
                fields=['student', 'subject', 'semester', 'assessment_type'],
                name='unique_student_subject_semester_assessment'
            ),
        ),
    ]
