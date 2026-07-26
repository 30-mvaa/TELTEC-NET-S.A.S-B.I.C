from django.core.management.base import BaseCommand
from pagos.services.google_sheets import sync_cobros_to_db


class Command(BaseCommand):
    help = "Sync payments from Google Sheets Cobros tab to the database"

    def handle(self, *args, **options):
        self.stdout.write("Syncing cobros from Google Sheets...")
        total, msg = sync_cobros_to_db()
        self.stdout.write(self.style.SUCCESS(f"Sync: {msg}"))
