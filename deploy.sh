#!/bin/bash

# Frontend build
echo "Building frontend..."
cd frontend
npm install
npm run build

# Backend deployment
echo "Deploying backend..."
cd ../backend

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput --settings=backend.settings_prod

# Run migrations
python manage.py migrate --settings=backend.settings_prod

# Start Gunicorn
gunicorn backend.wsgi:application --env DJANGO_SETTINGS_MODULE=backend.settings_prod --bind 0.0.0.0:8000 --workers 3 --timeout 120
