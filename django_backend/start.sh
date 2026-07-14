#!/bin/bash
# Start Django server + Google Sheets watcher
source .venv/bin/activate 2>/dev/null || true

# Start watcher in background
python manage.py watch_google_sheets --interval 60 &
WATCHER_PID=$!
echo "Watcher PID: $WATCHER_PID"

# Start Django server
python manage.py runserver 0.0.0.0:8000

# Cleanup
kill $WATCHER_PID 2>/dev/null
