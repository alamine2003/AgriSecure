from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveillance', '0008_camera_installed_at_camera_latitude_camera_longitude_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='fieldperimeter',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
    ]
