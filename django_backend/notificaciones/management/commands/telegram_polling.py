"""
Lee los mensajes del bot con getUpdates y los procesa igual que el webhook
(registro por cédula, /start, /help, /status, /contact).

Útil en local, donde Telegram no puede llamar al webhook.
No funciona si hay un webhook configurado (Telegram lo impide).

    python manage.py telegram_polling          # escucha continuamente (Ctrl+C para salir)
    python manage.py telegram_polling --once   # procesa lo pendiente y termina
"""

import os
import time

import requests
from django.core.management.base import BaseCommand, CommandError

from notificaciones.views import procesar_update_telegram


class Command(BaseCommand):
    help = 'Procesa mensajes del bot de Telegram mediante polling (para desarrollo local)'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Procesar pendientes y terminar')

    def handle(self, *args, **options):
        token = os.getenv('TELEGRAM_BOT_TOKEN')
        if not token:
            raise CommandError('TELEGRAM_BOT_TOKEN no está configurado')

        base = f'https://api.telegram.org/bot{token}'
        offset = None
        self.stdout.write('Escuchando mensajes del bot... (Ctrl+C para salir)')

        while True:
            params = {'timeout': 0 if options['once'] else 25, 'allowed_updates': '["message"]'}
            if offset is not None:
                params['offset'] = offset
            try:
                data = requests.get(f'{base}/getUpdates', params=params, timeout=35).json()
            except requests.RequestException as e:
                self.stderr.write(f'Error de red: {e}')
                if options['once']:
                    return
                time.sleep(5)
                continue

            if not data.get('ok'):
                raise CommandError(f"Telegram respondió: {data.get('description')}")

            for update in data.get('result', []):
                offset = update['update_id'] + 1
                msg = update.get('message') or {}
                self.stdout.write(f"  chat {msg.get('chat', {}).get('id')}: {msg.get('text', '')!r}")
                procesar_update_telegram(update)

            if options['once']:
                if offset is not None:
                    # confirmar a Telegram que ya se procesaron
                    requests.get(f'{base}/getUpdates', params={'offset': offset, 'timeout': 0}, timeout=10)
                return
