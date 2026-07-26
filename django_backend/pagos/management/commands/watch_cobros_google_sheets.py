import time
import logging
from django.core.management.base import BaseCommand
from pagos.services.google_sheets import sync_cobros_to_db

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Watch Google Sheets Cobros tab for changes and sync every N seconds"

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Check interval in seconds (default: 60)",
        )

    def handle(self, *args, **options):
        interval = options["interval"]
        self.stdout.write(f"Watching Cobros tab every {interval}s... (Ctrl+C to stop)")

        while True:
            try:
                total, msg = sync_cobros_to_db()
                if total:
                    self.stdout.write(self.style.SUCCESS(f"Cobros sync: {msg}"))
            except Exception as e:
                logger.error(f"Cobros sync error: {e}")

            time.sleep(interval)
