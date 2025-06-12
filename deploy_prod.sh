#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Function to echo with timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Check if running in production
if [ "$ENVIRONMENT" != "production" ]; then
    log "Error: This script should only be run in production environment"
    exit 1
fi

# Backup database
log "Creating database backup..."
pg_dump $DB_NAME > "backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Pull latest changes
log "Pulling latest changes..."
git pull origin main

# Frontend deployment
log "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Backend deployment
log "Deploying backend..."
cd backend

# Install dependencies
log "Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
log "Collecting static files..."
python manage.py collectstatic --noinput --settings=backend.settings_prod

# Run migrations
log "Running database migrations..."
python manage.py migrate --settings=backend.settings_prod

# Restart services
log "Restarting services..."
sudo systemctl restart nginx
sudo systemctl restart cleaar-oasis

# Verify deployment
log "Verifying deployment..."
curl -f http://localhost/api/health/ || (log "Health check failed" && exit 1)

log "Deployment completed successfully!"
