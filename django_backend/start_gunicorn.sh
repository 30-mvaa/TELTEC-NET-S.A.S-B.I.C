#!/bin/bash
python manage.py migrate --noinput
mkdir -p /tmp/staticfiles
STATIC_ROOT=/tmp/staticfiles python manage.py collectstatic --noinput 2>/dev/null || true
exec gunicorn teltec_backend.wsgi --bind "0.0.0.0:${PORT:-8000}" --workers 3 --timeout 120 --control-server-dir /tmp
