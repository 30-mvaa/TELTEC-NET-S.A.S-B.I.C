#!/bin/bash
exec gunicorn teltec_backend.wsgi --bind "0.0.0.0:${PORT:-8000}" --workers 3 --timeout 120
