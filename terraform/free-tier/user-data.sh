#!/bin/bash
# Bootstrap script for Seer free tier EC2 instance
# This script installs Docker, Docker Compose, and sets up the application

set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Git (if not already installed)
yum install -y git

# Install Nginx for reverse proxy
yum install -y nginx
systemctl enable nginx

# Install Certbot for SSL certificates
yum install -y certbot python3-certbot-nginx

# Install AWS CLI (optional, for ECR access if needed)
yum install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Add swap space (2GB) for memory optimization
dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Get instance public IP for backend domain
INSTANCE_IP=$$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
FRONTEND_DOMAIN="http://$$INSTANCE_IP"
BACKEND_DOMAIN="http://$$INSTANCE_IP/api"

# Clone repository (if repo_url is provided)
if [ -n "${repo_url}" ]; then
  cd /home/ec2-user
  git clone -b ${repo_branch} ${repo_url} seer || echo "Repository clone failed or already exists"
  cd seer || exit 1
else
  # Create directory structure if no repo
  mkdir -p /home/ec2-user/seer
  cd /home/ec2-user/seer
fi

# ECR image URLs (using $$ to escape $ for Terraform template)
ECR_REGISTRY="$${AWS_ACCOUNT_ID}.dkr.ecr.$${AWS_REGION}.amazonaws.com"
EXPRESSJS_IMAGE="$${ECR_REGISTRY}/production-seer-expressjs:latest"
NEXTJS_IMAGE="$${ECR_REGISTRY}/production-seer-nextjs:latest"

# Create docker-compose.yml for production (overwrite any existing one)
cat > docker-compose.yml <<EOF
version: '3.8'

services:
  expressjs:
    image: $${EXPRESSJS_IMAGE}
    container_name: seery-testnet-be
    ports:
      - "3016:3016"
    environment:
      - PORT=3016
      - SEERY_FRONTEND_DOMAIN=$$FRONTEND_DOMAIN
      - OPENAI_API_KEY=$${OPENAI_API_KEY}
      - OPENAI_MODEL=$${openai_model}
      - BLOCKCHAIN_NETWORK=$${NETWORK}
      - BLOCKCHAIN_RPC=$${BLOCKCHAIN_RPC}
      - BLOCKCHAIN_CONTRACT_ADDRESS=$${CONTRACT_ADDRESS}
      - BLOCKCHAIN_WALLET_ADDRESS=$${blockchain_wallet_address}
      - BLOCKCHAIN_PRIVATE_KEY=$${BLOCKCHAIN_PRIVATE_KEY}
      - BINANCE_API_KEY=$${binance_api_key}
      - BINANCE_SECRET_KEY=$${binance_secret_key}
      - BINANCE_TESTNET=$${binance_testnet}
      - THENEWS_API_KEY=$${thenews_api_key}
    restart: unless-stopped

  nextjs:
    image: $${NEXTJS_IMAGE}
    ports:
      - "3015:3015"
    environment:
      - NEXT_PUBLIC_SEERY_BACKEND_DOMAIN=$$BACKEND_DOMAIN
      - SEERY_BACKEND_DOMAIN=$$BACKEND_DOMAIN
      - PORT=3015
      - NODE_ENV=production
    container_name: seery-testnet-fe
    restart: unless-stopped
    depends_on:
      - expressjs
EOF

# Create .env file with environment variables (matching expressjs/.env format)
if [ -n "${openai_api_key}" ]; then
  cat > .env <<EOF
# Server (defaults)
PORT=3016
SEERY_FRONTEND_DOMAIN=http://localhost:3015

# Blockchain (defaults - add your values when needed)
BLOCKCHAIN_NETWORK=${network}
BLOCKCHAIN_RPC=${blockchain_rpc}
BLOCKCHAIN_WALLET_ADDRESS=${blockchain_wallet_address}
BLOCKCHAIN_PRIVATE_KEY=${blockchain_private_key}
BLOCKCHAIN_CONTRACT_ADDRESS=${contract_address}

# OpenAI (optional - add when you need AI features)
OPENAI_API_KEY=${openai_api_key}
OPENAI_MODEL=${openai_model}

# Binance Trading (optional - add if you use trading)
BINANCE_API_KEY=${binance_api_key}
BINANCE_SECRET_KEY=${binance_secret_key}
BINANCE_TESTNET=${binance_testnet}

THENEWS_API_KEY=${thenews_api_key}
EOF
else
  cat > .env <<EOF
# Server (defaults)
PORT=3016
SEERY_FRONTEND_DOMAIN=http://localhost:3015

# Blockchain (defaults - add your values when needed)
BLOCKCHAIN_NETWORK=${network}
BLOCKCHAIN_RPC=${blockchain_rpc}
BLOCKCHAIN_WALLET_ADDRESS=${contract_address}
BLOCKCHAIN_PRIVATE_KEY=${blockchain_private_key}
BLOCKCHAIN_CONTRACT_ADDRESS=${contract_address}

# OpenAI (optional - add when you need AI features)
# OPENAI_API_KEY not set - AI features disabled (app works without it)
OPENAI_MODEL=gpt-3.5-turbo

# Binance Trading (optional - add if you use trading)
BINANCE_API_KEY=https://api-gcp.binance.com
BINANCE_SECRET_KEY=...
BINANCE_TESTNET=true

THENEWS_API_KEY=25506DDEBFB394B2692FC7EE5FF9F12F
EOF
fi

# Set proper permissions
chown -R ec2-user:ec2-user /home/ec2-user/seer
chmod 600 /home/ec2-user/seer/.env

# Configure Nginx reverse proxy (HTTP - will be upgraded to HTTPS by certbot)
cat > /etc/nginx/conf.d/seery.conf <<'NGINXEOF'
server {
    listen 80;
    server_name theseery.com www.theseery.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Express.js)
    location /api {
        proxy_pass http://localhost:3016;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Default server for IP access (separate from domain config)
server {
    listen 80 default_server;
    server_name _;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3015;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Express.js)
    location /api {
        proxy_pass http://localhost:3016;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

# Start Nginx
systemctl start nginx

# Wait for services to be ready before requesting SSL certificate
sleep 30

# Request SSL certificate from Let's Encrypt (non-interactive)
certbot --nginx -d theseery.com -d www.theseery.com --non-interactive --agree-tos --email admin@theseery.com --redirect || echo "SSL certificate setup failed - will need to run manually after DNS propagates"

# Build and start services (run as ec2-user)
sudo -u ec2-user bash <<'USERSCRIPT'
cd /home/ec2-user/seer
docker-compose build
docker-compose up -d
USERSCRIPT

# Log completion
echo "Seer deployment completed at $(date)" >> /var/log/seer-deployment.log

