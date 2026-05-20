from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('surveillance', '0011_agentregistrationrequest_is_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='detection',
            name='is_false_positive',
            field=models.BooleanField(
                default=False,
                help_text="Marqué comme faux positif par l'agent"
            ),
        ),
    ]
