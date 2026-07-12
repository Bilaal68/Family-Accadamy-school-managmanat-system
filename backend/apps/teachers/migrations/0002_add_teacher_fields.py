# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teachers', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='phone_number',
            field=models.CharField(blank=True, default='', max_length=20),
        ),
        migrations.AddField(
            model_name='teacher',
            name='photo',
            field=models.ImageField(blank=True, null=True, upload_to='teachers/photos/'),
        ),
        migrations.AddField(
            model_name='teacher',
            name='qualification_document',
            field=models.FileField(blank=True, null=True, upload_to='teachers/qualifications/'),
        ),
    ]
