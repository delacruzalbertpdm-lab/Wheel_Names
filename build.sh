#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> [1/5] Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> [2/5] Building React frontend production bundle..."
npm --prefix frontend install
npm --prefix frontend run build

echo "==> [3/5] Applying Django database migrations..."
python backend/manage.py migrate

echo "==> [4/5] Seeding initial sample participants..."
python backend/manage.py seed_participants || true

echo "==> [5/5] Collecting static files..."
python backend/manage.py collectstatic --no-input || true

echo "==> Build successfully finished!"
