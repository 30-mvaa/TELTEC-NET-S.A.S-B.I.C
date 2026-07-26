#!/bin/bash
# Start Django server + Google Sheets watchers (clients + cobros)
source .venv/bin/activate 2>/dev/null || true

# Start clients watcher in background
python manage.py watch_google_sheets --interval 60 &
WATCHER_PID=$!
echo "Clients watcher PID: $WATCHER_PID"

# Start cobros watcher in background
python manage.py watch_cobros_google_sheets --interval 60 &
COBROS_WATCHER_PID=$!
echo "Cobros watcher PID: $COBROS_WATCHER_PID"

# Start Django server with gunicorn in production, runserver in dev
if [ "$DJANGO_ENV" = "production" ]; then
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
    gunicorn teltec_backend.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120
else
    python manage.py runserver 0.0.0.0:8000
fi

# Cleanup
kill $WATCHER_PID 2>/dev/null
kill $COBROS_WATCHER_PID 2>/dev/null
