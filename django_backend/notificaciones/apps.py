import os
import sys

from django.apps import AppConfig


class NotificacionesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notificaciones'
    verbose_name = 'WhatsApp y alertas automáticas'
    verbose_name_plural = 'WhatsApp y alertas automáticas'

    def ready(self):
        # Solo en el servidor web: runserver (proceso hijo del autoreload) o gunicorn.
        es_runserver = 'runserver' in sys.argv and os.environ.get('RUN_MAIN') == 'true'
        es_gunicorn = 'gunicorn' in os.path.basename(sys.argv[0] if sys.argv else '')
        if es_runserver or es_gunicorn:
            from . import scheduler
            scheduler.iniciar()
