from django.core.management.base import BaseCommand
from clientes.services.google_sheets import sync_sheets_to_db


class Command(BaseCommand):
    help = "Sync clients from Google Sheets to the database"

    def handle(self, *args, **options):
        self.stdout.write("Syncing from Google Sheets...")
        total, msg = sync_sheets_to_db()
        self.stdout.write(self.style.SUCCESS(f"Sync: {msg}"))
