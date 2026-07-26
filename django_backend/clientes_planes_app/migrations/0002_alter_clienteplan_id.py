from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('clientes_planes_app', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(lambda apps, schema_editor: None),
    ]
