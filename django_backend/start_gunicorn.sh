#!/bin/bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput || true
exec gunicorn teltec_backend.wsgi --bind "0.0.0.0:${PORT:-8000}" --workers 3 --timeout 120
