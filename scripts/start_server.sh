#!/usr/bin/env bash
set -euo pipefail

PORT_VALUE=${PORT:-8000}
WEB_CONCURRENCY_VALUE=${WEB_CONCURRENCY:-2}
GUNICORN_THREADS_VALUE=${GUNICORN_THREADS:-4}
GUNICORN_TIMEOUT_VALUE=${GUNICORN_TIMEOUT:-120}

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn on port ${PORT_VALUE}..."
exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT_VALUE}" \
  --workers "${WEB_CONCURRENCY_VALUE}" \
  --threads "${GUNICORN_THREADS_VALUE}" \
  --timeout "${GUNICORN_TIMEOUT_VALUE}"
