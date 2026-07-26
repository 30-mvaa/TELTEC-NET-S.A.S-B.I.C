from django.db import migrations


def forwards(apps, schema_editor):
    try:
        Plan = apps.get_model('configuracion', 'Plan')
        Plan.objects.all().delete()
    except Exception:
        pass
    try:
        Sector = apps.get_model('configuracion', 'Sector')
        Sector.objects.all().delete()
    except Exception:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('configuracion', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
