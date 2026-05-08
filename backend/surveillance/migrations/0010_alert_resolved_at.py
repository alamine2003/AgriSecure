from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveillance', '0009_fieldperimeter_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='alert',
            name='resolved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
