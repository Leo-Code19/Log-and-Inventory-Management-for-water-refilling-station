# Cleaar Oasis Production Deployment Guide

## Prerequisites

- Domain name pointing to your server
- Ubuntu 22.04 LTS server
- PostgreSQL 14+
- Node.js 18+
- Python 3.11+
- Nginx

## 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib redis-server

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2. SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## 3. Database Setup

```bash
# Create database and user
sudo -u postgres psql < setup_database.sql

# Verify connection
psql -U cleaar_oasis_user -h localhost -d cleaar_oasis_db
```

## 4. Application Setup

```bash
# Create application directory
sudo mkdir -p /var/www/cleaar-oasis
sudo chown -R $USER:$USER /var/www/cleaar-oasis

# Clone repository
git clone https://your-repo-url.git /var/www/cleaar-oasis

# Setup frontend
cd /var/www/cleaar-oasis/frontend
npm install
npm run build

# Setup backend
cd /var/www/cleaar-oasis/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 5. Environment Setup

1. Copy `.env.production` to backend and frontend directories
2. Update the environment variables with your production values
3. Make sure all sensitive information is properly set

## 6. Nginx Setup

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/cleaar-oasis

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cleaar-oasis /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 7. Gunicorn Setup

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/cleaar-oasis.service
```

Add the following content:

```ini
[Unit]
Description=Cleaar Oasis Gunicorn Daemon
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/cleaar-oasis/backend
Environment="PATH=/var/www/cleaar-oasis/backend/venv/bin"
Environment="DJANGO_SETTINGS_MODULE=backend.settings_prod"
ExecStart=/var/www/cleaar-oasis/backend/venv/bin/gunicorn --workers 3 --bind unix:/tmp/cleaar-oasis.sock backend.wsgi:application

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl start cleaar-oasis
sudo systemctl enable cleaar-oasis
```

## 8. Final Steps

1. Run database migrations:
```bash
python manage.py migrate --settings=backend.settings_prod
```

2. Collect static files:
```bash
python manage.py collectstatic --settings=backend.settings_prod
```

3. Create superuser:
```bash
python manage.py createsuperuser --settings=backend.settings_prod
```

## 9. Monitoring Setup

1. Install monitoring tools:
```bash
pip install sentry-sdk
```

2. Set up logging directories:
```bash
sudo mkdir -p /var/log/cleaar-oasis
sudo chown -R www-data:www-data /var/log/cleaar-oasis
```

## 10. Backup Setup

Create a backup script at `/var/www/cleaar-oasis/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cleaar-oasis"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump cleaar_oasis_db > "$BACKUP_DIR/db_$DATE.sql"

# Media files backup
tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" /var/www/cleaar-oasis/backend/media

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:
```bash
0 0 * * * /var/www/cleaar-oasis/backup.sh
```

## Maintenance

- Regularly check logs: `/var/log/cleaar-oasis/`
- Monitor system resources
- Keep dependencies updated
- Regularly test backups
- Monitor SSL certificate expiration
