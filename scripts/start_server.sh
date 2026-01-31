#!/usr/bin/env bash
set -uo pipefail

echo "Ensuring dependencies are installed..."
if ! python -m pip install -r requirements.txt; then
  echo "Dependency installation failed." >&2
  exit 1
fi

echo "Checking for migration metadata changes..."
if python manage.py makemigrations --dry-run --check --verbosity 1; then
  echo "No new migration changes detected. Skipping migrate."
else
  echo "Model changes detected; running migrations."
  if ! python manage.py migrate --noinput; then
    echo "Migration step failed." >&2
    exit 1
  fi
fi

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application
