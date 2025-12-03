#!/bin/bash
# Setup domain and SSL for Paperless Gateway

set -e

DOMAIN="tools.codershive.in"
APP_PORT="8001"
APP_DIR="/home/$USER/paperless-gateway/backend-unlocker"

echo "======================================"
echo "Setting up domain: $DOMAIN"
echo "======================================"
echo ""

# Install Nginx
echo "[1/6] Installing Nginx..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo "[2/6] Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Increase body size for large PDF uploads
    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts for large file uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable the site
echo "[3/6] Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo "[4/6] Testing Nginx configuration..."
sudo nginx -t

# Start and enable Nginx
echo "[5/6] Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
echo "[6/6] Setting up SSL certificate..."
echo ""
echo "======================================"
echo "SSL Certificate Setup"
echo "======================================"
echo "Make sure your domain $DOMAIN points to this server's IP:"
echo "  - A record: $DOMAIN -> 84.247.136.87"
echo ""
read -p "Press Enter when DNS is configured, or Ctrl+C to cancel..."

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email idanielsdev@gmail.com --redirect

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Your app is now accessible at:"
echo "  https://$DOMAIN"
echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -5
echo ""
echo "Useful commands:"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - Renew SSL: sudo certbot renew"
echo ""

