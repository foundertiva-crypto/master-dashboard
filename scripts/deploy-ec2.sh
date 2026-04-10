#!/usr/bin/env bash
#############################################################
# MODULE 9 — AWS EC2 Deployment Script
# Master Dashboard Phase-1
#
# Run this ON the EC2 instance (Ubuntu 22.04 recommended).
# ERPNext is assumed to already be running on port 8000.
# This script will NOT touch ERPNext.
#############################################################

set -euo pipefail

echo "=========================================="
echo " Master Dashboard — EC2 Setup"
echo "=========================================="

# ---- 1. System update ----
echo "[1/8] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# ---- 2. Install Node.js 20 LTS ----
echo "[2/8] Installing Node.js 20..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "Node: $(node -v)  npm: $(npm -v)"

# ---- 3. Install Docker & Docker Compose ----
echo "[3/8] Installing Docker..."
if ! command -v docker &>/dev/null; then
  sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER"
fi
echo "Docker: $(docker --version)"

# ---- 4. Install Nginx ----
echo "[4/8] Installing Nginx..."
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
fi
echo "Nginx: $(nginx -v 2>&1)"

# ---- 5. Install PostgreSQL client ----
echo "[5/8] Installing PostgreSQL client..."
sudo apt-get install -y postgresql-client

# ---- 6. Clone / update repository ----
echo "[6/8] Setting up project..."
PROJECT_DIR="/opt/master-dashboard"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "  → Cloning repository..."
  sudo mkdir -p "$PROJECT_DIR"
  sudo chown "$USER":"$USER" "$PROJECT_DIR"
  # Replace with your actual repository URL:
  # git clone https://github.com/YOUR_ORG/master-dashboard.git "$PROJECT_DIR"
  echo "  ⚠ Clone your repo to $PROJECT_DIR or copy files manually."
else
  echo "  → Project directory exists. Pull latest if using git."
fi

# ---- 7. Configure environment ----
echo "[7/8] Checking environment..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "  → Creating .env from .env.example"
  cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  echo "  ⚠ EDIT $PROJECT_DIR/.env with your actual credentials!"
fi

# ---- 8. Start services ----
echo "[8/8] Starting services with Docker Compose..."
cd "$PROJECT_DIR"

# Build and start all containers
docker compose up -d --build

echo ""
echo "=========================================="
echo " Deployment complete!"
echo "=========================================="
echo ""
echo " Services:"
echo "   ERPNext      → http://localhost:8000 (unchanged)"
echo "   Dashboard    → http://localhost:3000"
echo "   API Gateway  → http://localhost:4000"
echo "   Nginx Proxy  → http://localhost:80"
echo ""
echo " Nginx routes:"
echo "   /erp         → ERPNext"
echo "   /dashboard   → Refine Dashboard"
echo "   /api         → API Gateway"
echo ""
echo " Next steps:"
echo "   1. Edit /opt/master-dashboard/.env"
echo "   2. Set up SSL certificates"
echo "   3. Configure S3 bucket"
echo "   4. Register first admin user via POST /api/auth/register"
echo ""
echo " Useful commands:"
echo "   docker compose logs -f         # View all logs"
echo "   docker compose restart api     # Restart API"
echo "   docker compose down            # Stop all"
echo "=========================================="
