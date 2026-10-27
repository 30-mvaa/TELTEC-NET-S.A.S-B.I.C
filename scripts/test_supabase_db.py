#!/usr/bin/env python3
"""Prueba la conexión Django → Postgres (local / Supabase / Neon)."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "django_backend"
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / ".env.local", override=True)
load_dotenv(ROOT / ".env", override=True)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "teltec_backend.settings")

import django  # noqa: E402

django.setup()

from django.db import connection  # noqa: E402


def main() -> int:
    url = os.environ.get("DATABASE_URL", "")
    if url:
        parsed = urlparse(url)
        print(f"DATABASE_URL host: {parsed.hostname}")
        print(f"DATABASE_URL port: {parsed.port}")
        print(f"DATABASE_URL db:   {parsed.path.lstrip('/')}")
        if parsed.hostname and "supabase" in parsed.hostname:
            print("Proveedor detectado: Supabase")
        elif parsed.hostname in ("localhost", "127.0.0.1"):
            print("Proveedor detectado: Postgres local")
        else:
            print(f"Proveedor detectado: {parsed.hostname}")
    else:
        print("DATABASE_URL no definida; usando DB_* de settings")

    with connection.cursor() as cursor:
        cursor.execute("SELECT version(), current_database(), current_user")
        version, db, user = cursor.fetchone()
        cursor.execute(
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_schema = 'public'"
        )
        tables = cursor.fetchone()[0]

    print("Conexión OK")
    print(f"  database: {db}")
    print(f"  user:     {user}")
    print(f"  tablas public: {tables}")
    print(f"  version:  {version.split(',')[0]}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR de conexión: {exc}", file=sys.stderr)
        raise SystemExit(1)
