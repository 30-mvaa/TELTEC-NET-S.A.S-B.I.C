import time
import logging
from django.core.management.base import BaseCommand
from clientes.services.google_sheets import sync_sheets_to_db

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Watch Google Sheets for new clients and sync every N seconds"

    def add_arguments(self, parser):
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Check interval in seconds (default: 60)",
        )

    def handle(self, *args, **options):
        interval = options["interval"]
        self.stdout.write(f"Watching Google Sheets every {interval}s... (Ctrl+C to stop)")

        while True:
            try:
                created, errors = sync_sheets_to_db()
                if created:
                    self.stdout.write(self.style.SUCCESS(f"Synced {created} new clients"))
                if errors:
                    self.stdout.write(self.style.WARNING(f"Errors: {errors}"))
            except Exception as e:
                logger.error(f"Sync error: {e}")

            time.sleep(interval)
