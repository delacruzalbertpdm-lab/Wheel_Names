#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> [1/3] Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "==> [2/3] Applying Django database migrations & seeding initial participants..."
python backend/manage.py migrate
python backend/manage.py seed_participants || true

echo "==> [3/3] Collecting static files..."
python backend/manage.py collectstatic --no-input || true

echo "==> PulseDraw build completed successfully!"
