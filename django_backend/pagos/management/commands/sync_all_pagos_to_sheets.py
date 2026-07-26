from django.core.management.base import BaseCommand
from pagos.services.google_sheets import sync_all_pagos_to_sheets


class Command(BaseCommand):
    help = "Sync all pagos from DB to Google Sheets Cobros tab (batch)"

    def handle(self, *args, **options):
        self.stdout.write("Syncing all pagos to cobros sheet...")
        total, msg = sync_all_pagos_to_sheets()
        self.stdout.write(self.style.SUCCESS(f"Sync: {msg}"))
