from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("enrollment", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="enrollmentrequest",
            name="father_photo",
            field=models.ImageField(
                blank=True, null=True, upload_to="enrollment/parent_photos/"
            ),
        ),
        migrations.AddField(
            model_name="enrollmentrequest",
            name="mother_photo",
            field=models.ImageField(
                blank=True, null=True, upload_to="enrollment/parent_photos/"
            ),
        ),
        migrations.AlterField(
            model_name="enrollmentdocument",
            name="document_type",
            field=models.CharField(
                choices=[
                    ("BIRTH_CERTIFICATE", "Birth Certificate"),
                    ("TRANSCRIPT", "Previous School Report Card"),
                    ("TRANSFER_LETTER", "Transfer Letter"),
                    ("PHOTO", "Student Photo"),
                    ("OTHER", "Other"),
                ],
                max_length=50,
            ),
        ),
    ]
