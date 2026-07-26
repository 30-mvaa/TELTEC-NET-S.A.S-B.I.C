from django.db import migrations


def forwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('notificaciones', '0005_delete_llamadaautomatizada'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
