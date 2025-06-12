#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/cleaar-oasis"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cleaar_oasis_db"
DB_USER="cleaar_oasis_user"
APP_DIR="/var/www/cleaar-oasis"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Creating database backup..."
PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h localhost "$DB_NAME" > "$BACKUP_DIR/db_$DATE.sql"
gzip "$BACKUP_DIR/db_$DATE.sql"

# Media files backup
echo "Creating media files backup..."
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" "$APP_DIR/backend/media"

# Static files backup
echo "Creating static files backup..."
tar -czf "$BACKUP_DIR/static_$DATE.tar.gz" "$APP_DIR/backend/staticfiles"

# Environment files backup
echo "Creating environment files backup..."
tar -czf "$BACKUP_DIR/env_$DATE.tar.gz" "$APP_DIR/backend/.env.production" "$APP_DIR/frontend/.env.production"

# Keep only last 7 days of backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -type f -mtime +7 -delete

# Create backup report
echo "Creating backup report..."
echo "Backup completed at $(date)" > "$BACKUP_DIR/backup_report_$DATE.txt"
echo "Files backed up:" >> "$BACKUP_DIR/backup_report_$DATE.txt"
ls -lh "$BACKUP_DIR" | grep "$DATE" >> "$BACKUP_DIR/backup_report_$DATE.txt"

# Send backup report (uncomment and configure if needed)
# mail -s "Cleaar Oasis Backup Report $DATE" admin@your-domain.com < "$BACKUP_DIR/backup_report_$DATE.txt"

echo "Backup completed successfully!"
