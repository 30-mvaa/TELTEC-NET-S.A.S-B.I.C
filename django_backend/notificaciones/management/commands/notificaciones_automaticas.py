"""
Calcula y envía los avisos de cobro del día.

    python manage.py notificaciones_automaticas                      # simulación (no escribe nada)
    python manage.py notificaciones_automaticas --fecha 2026-11-10   # simular otro día
    python manage.py notificaciones_automaticas --cliente-id 1 --enviar
    NOTIFICACIONES_AUTO_ENABLED=true python manage.py notificaciones_automaticas --enviar
"""

import os
from datetime import date

from django.core.management.base import BaseCommand, CommandError

from notificaciones.services.automaticas import ejecutar_notificaciones


class Command(BaseCommand):
    help = 'Avisos automáticos: 3 días antes del pago, 2 días después (vencido) y deuda en meses'

    def add_arguments(self, parser):
        parser.add_argument('--enviar', action='store_true', help='Crear y enviar de verdad')
        parser.add_argument('--fecha', help='Fecha a simular (AAAA-MM-DD). Solo para simulación')
        parser.add_argument('--cliente-id', type=int, help='Limitar a un cliente')

    def handle(self, *args, **opts):
        hoy = None
        if opts.get('fecha'):
            if opts['enviar']:
                raise CommandError('--fecha solo se permite en simulación')
            hoy = date.fromisoformat(opts['fecha'])

        auto = os.getenv('NOTIFICACIONES_AUTO_ENABLED', 'false').lower() == 'true'
        if opts['enviar'] and not opts.get('cliente_id') and not auto:
            raise CommandError('Envío a todos desactivado. Define NOTIFICACIONES_AUTO_ENABLED=true '
                               'o usa --cliente-id para una prueba.')

        r = ejecutar_notificaciones(enviar=opts['enviar'], hoy=hoy, cliente_id=opts.get('cliente_id'))
        modo = 'ENVÍO REAL' if opts['enviar'] else 'SIMULACIÓN'
        self.stdout.write(f"{modo} ({hoy or 'hoy'}): {r['total']} aviso(s) {r['por_tipo']}")
        for d in r['detalle']:
            self.stdout.write(f"  - [{d['tipo']}] {d['cliente']} vía {d['canal']}")
            if 'mensaje' in d:
                self.stdout.write('      ' + d['mensaje'].replace('\n', '\n      '))
        if opts['enviar']:
            self.stdout.write(f"Creadas: {r['creadas']} | Telegram enviados: {r['enviadas_telegram']} | "
                              f"fallidos: {r['fallidas_telegram']} | pendientes WhatsApp: {r['pendientes_whatsapp']}")
