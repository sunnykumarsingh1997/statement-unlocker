#!/bin/bash
# Paperless Gateway Middleware - Installation Script
# Run this on your Ubuntu/Debian VPS

set -e

echo "======================================"
echo "Paperless Gateway Middleware Installer"
echo "======================================"
echo ""

# Variables
APP_DIR="/home/$USER/paperless-gateway"
SERVICE_NAME="paperless-gateway"
REPO_URL="https://github.com/sunnykumarsingh1997/mstools.git"

# Update system
echo "[1/7] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "[2/7] Installing Python and dependencies..."
sudo apt install -y python3 python3-pip python3-venv git curl

# Create app directory
echo "[3/7] Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo "[4/7] Cloning repository..."
if [ -d ".git" ]; then
    git pull origin main
else
    git clone $REPO_URL .
fi

# Navigate to backend
cd backend-unlocker

# Create virtual environment
echo "[5/7] Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service
echo "[6/7] Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Paperless Gateway Middleware
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend-unlocker
Environment="PATH=$APP_DIR/backend-unlocker/venv/bin"
Environment="PAPERLESS_URL=http://84.247.136.87:8000"
Environment="PAPERLESS_TOKEN=bb02a22ccce82096e308469bde1fd85c8d675a66"
ExecStart=$APP_DIR/backend-unlocker/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "[7/7] Starting service..."
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
echo "Service Status:"
sudo systemctl status $SERVICE_NAME --no-pager
echo ""
echo "Access the app at: http://$(curl -s ifconfig.me):8001"
echo ""
echo "Useful commands:"
echo "  - View logs: sudo journalctl -u $SERVICE_NAME -f"
echo "  - Restart: sudo systemctl restart $SERVICE_NAME"
echo "  - Stop: sudo systemctl stop $SERVICE_NAME"
echo ""

