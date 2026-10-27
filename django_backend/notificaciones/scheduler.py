"""
Ejecuta las notificaciones automáticas una vez al día dentro del propio servidor.

- Solo arranca si NOTIFICACIONES_AUTO_ENABLED=true.
- Hora de ejecución: NOTIFICACIONES_HORA (0-23, hora de Ecuador), por defecto 9.
- Un candado de archivo en /tmp garantiza que solo un proceso (de varios
  workers de gunicorn) ejecute el envío.
- Si el servidor se reinicia, no se duplican avisos: el servicio no repite el
  mismo tipo de aviso dentro de su ventana.
"""

import fcntl
import logging
import os
import threading
import time

from django.db import close_old_connections
from django.utils import timezone

logger = logging.getLogger(__name__)

_LOCK_PATH = '/tmp/teltec_notificaciones.lock'
_lock_file = None
_iniciado = False


def _bucle(hora: int):
    from .services.automaticas import ejecutar_notificaciones

    ultima_fecha = None
    while True:
        try:
            ahora = timezone.localtime()
            if ahora.hour >= hora and ultima_fecha != ahora.date():
                close_old_connections()
                resumen = ejecutar_notificaciones(enviar=True)
                ultima_fecha = ahora.date()
                logger.info("Notificaciones automáticas ejecutadas: %s",
                            {k: v for k, v in resumen.items() if k != 'detalle'})
        except Exception:
            logger.exception("Error en notificaciones automáticas")
        finally:
            close_old_connections()
        time.sleep(600)  # revisar cada 10 minutos


def iniciar():
    global _lock_file, _iniciado
    if _iniciado:
        return
    if os.getenv('NOTIFICACIONES_AUTO_ENABLED', 'false').lower() != 'true':
        return

    try:
        _lock_file = open(_LOCK_PATH, 'w')
        fcntl.flock(_lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        return  # otro proceso ya tiene el programador

    try:
        hora = int(os.getenv('NOTIFICACIONES_HORA', '9'))
    except ValueError:
        hora = 9

    _iniciado = True
    threading.Thread(target=_bucle, args=(hora,), daemon=True, name='notificaciones-auto').start()
    logger.info("Programador de notificaciones activo (todos los días desde las %02d:00)", hora)
