#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
FRONTEND_ROOT="$PROJECT_ROOT/Warehouseloadingboardui-main"

echo "Installing backend dependencies"
python -m pip install -r "$PROJECT_ROOT/requirements.txt"

if [ -d "$FRONTEND_ROOT" ]; then
  echo "Building frontend assets"
  pushd "$FRONTEND_ROOT" >/dev/null
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
  npm run build
  popd >/dev/null
else
  echo "Warning: frontend folder not found at $FRONTEND_ROOT"
fi
