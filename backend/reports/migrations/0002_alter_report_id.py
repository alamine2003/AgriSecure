import uuid
from django.db import migrations, models


def migrate_id_to_uuid(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("ALTER TABLE reports_report DROP CONSTRAINT reports_report_pkey;")
        schema_editor.execute("ALTER TABLE reports_report DROP COLUMN id;")
        schema_editor.execute(
            "ALTER TABLE reports_report ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;"
        )


def reverse_id_to_bigint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("ALTER TABLE reports_report DROP CONSTRAINT reports_report_pkey;")
        schema_editor.execute("ALTER TABLE reports_report DROP COLUMN id;")
        schema_editor.execute(
            "ALTER TABLE reports_report ADD COLUMN id bigserial PRIMARY KEY;"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            code=migrate_id_to_uuid,
            reverse_code=reverse_id_to_bigint,
        ),
        migrations.AlterField(
            model_name='report',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
