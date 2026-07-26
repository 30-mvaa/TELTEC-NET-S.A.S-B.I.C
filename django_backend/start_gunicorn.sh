#!/bin/bash
export TMPDIR=/tmp
export HOME=/tmp
export XDG_RUNTIME_DIR=/tmp

python manage.py migrate --noinput
mkdir -p /tmp/staticfiles /tmp/media
python manage.py collectstatic --noinput 2>/dev/null || true

exec gunicorn teltec_backend.wsgi \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers 3 \
    --timeout 120 \
    --worker-tmp-dir /tmp
