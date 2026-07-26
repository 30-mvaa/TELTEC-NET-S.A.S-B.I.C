from django.db import migrations


def forwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('sitio_web', '0006_redsocial_fecha_creacion_redsocial_icono_and_more'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
