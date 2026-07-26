from django.core.management.base import BaseCommand
from django.db import connection
import bcrypt


class Command(BaseCommand):
    help = 'Reset admin password'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True)
        parser.add_argument('--password', type=str, required=True)

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        with connection.cursor() as cursor:
            cursor.execute(
                'UPDATE usuarios SET password_hash = %s WHERE email = %s',
                [pw_hash, email]
            )
            rows = cursor.rowcount
        self.stdout.write(self.style.SUCCESS(f'Updated {rows} user(s) with email {email}'))
