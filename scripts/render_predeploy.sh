#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/.."

echo "[predeploy] Running Render database readiness checks"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[predeploy] DATABASE_URL is set"
else
  echo "[predeploy] DATABASE_URL is not set; this script will still run against the default SQLite database"
fi

python manage.py check --database default

echo "[predeploy] Applying migrations (if any)"
python manage.py migrate --noinput

echo "[predeploy] Verifying database connection"
python - <<'PY'
from django.db import connections
conn = connections["default"]
conn.ensure_connection()
print("[predeploy] Database connection is healthy")
PY
