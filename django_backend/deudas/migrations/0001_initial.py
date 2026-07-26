from django.db import migrations


def forwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clientes', '0003_remove_cliente_precio_plan_remove_cliente_sector_and_more'),
        ('planes_app', '0002_alter_plan_id'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
