from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveillance', '0010_alert_resolved_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='agentregistrationrequest',
            name='is_archived',
            field=models.BooleanField(default=False, help_text='Demande archivée (masquée de la liste principale)'),
        ),
    ]
