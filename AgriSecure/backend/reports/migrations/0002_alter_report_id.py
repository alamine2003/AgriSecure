import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        # PostgreSQL ne peut pas caster bigint -> uuid directement.
        # On supprime la PK existante, on ajoute une colonne uuid, on la définit en PK.
        migrations.RunSQL(
            sql=[
                # Supprimer la contrainte PK et la colonne id auto-increment
                "ALTER TABLE reports_report DROP CONSTRAINT reports_report_pkey;",
                "ALTER TABLE reports_report DROP COLUMN id;",
                # Ajouter la nouvelle colonne uuid avec valeur par défaut
                "ALTER TABLE reports_report ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;",
            ],
            reverse_sql=[
                "ALTER TABLE reports_report DROP CONSTRAINT reports_report_pkey;",
                "ALTER TABLE reports_report DROP COLUMN id;",
                "ALTER TABLE reports_report ADD COLUMN id bigserial PRIMARY KEY;",
            ],
        ),
        # Mettre à jour l'état Django pour qu'il reflète le nouveau champ
        migrations.AlterField(
            model_name='report',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
