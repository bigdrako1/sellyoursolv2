#!/bin/bash
# Setup script for staging environment

set -e

# Display usage information
function show_usage {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --host <hostname>     Hostname for the staging server"
    echo "  -u, --user <username>     Username for SSH access"
    echo "  -k, --key <key_file>      SSH key file"
    echo "  --help                    Show this help message"
    exit 1
}

# Parse command line arguments
HOST=""
USER=""
KEY_FILE=""

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--host)
            HOST="$2"
            shift
            shift
            ;;
        -u|--user)
            USER="$2"
            shift
            shift
            ;;
        -k|--key)
            KEY_FILE="$2"
            shift
            shift
            ;;
        --help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate arguments
if [[ -z "$HOST" ]]; then
    echo "Error: Hostname is required"
    show_usage
fi

if [[ -z "$USER" ]]; then
    echo "Error: Username is required"
    show_usage
fi

if [[ -z "$KEY_FILE" ]]; then
    echo "Error: SSH key file is required"
    show_usage
fi

# Check if SSH key file exists
if [[ ! -f "$KEY_FILE" ]]; then
    echo "Error: SSH key file $KEY_FILE not found"
    exit 1
fi

# Set SSH options
SSH_OPTS="-i $KEY_FILE -o StrictHostKeyChecking=no"

echo "Setting up staging environment on $HOST..."

# Create deployment directory
echo "Creating deployment directory..."
ssh $SSH_OPTS $USER@$HOST "mkdir -p /opt/trading-ai"

# Copy deployment files
echo "Copying deployment files..."
scp $SSH_OPTS -r deployment/* $USER@$HOST:/opt/trading-ai/

# Create environment file
echo "Creating environment file..."
cat > .env.staging << EOF
# Environment
ENVIRONMENT=staging

# Database
MONGO_USERNAME=trading_ai
MONGO_PASSWORD=staging_password
DATABASE_URL=mongodb://trading_ai:staging_password@mongodb:27017/trading_ai?authSource=admin

# Redis
REDIS_PASSWORD=staging_password
REDIS_URL=redis://:staging_password@redis:6379/0

# JWT
JWT_SECRET=staging_jwt_secret

# API Keys
GLASSNODE_API_KEY=staging_glassnode_api_key
CRYPTOQUANT_API_KEY=staging_cryptoquant_api_key
INTOTHEBLOCK_API_KEY=staging_intotheblock_api_key

# Grafana
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=staging_grafana_password

# Logging
LOG_LEVEL=info
EOF

# Copy environment file
echo "Copying environment file..."
scp $SSH_OPTS .env.staging $USER@$HOST:/opt/trading-ai/.env

# Install Docker and Docker Compose
echo "Installing Docker and Docker Compose..."
ssh $SSH_OPTS $USER@$HOST << 'EOF'
# Update package list
sudo apt-get update

# Install dependencies
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create Docker network
sudo docker network create trading-network || true
EOF

# Create SSL certificates
echo "Creating SSL certificates..."
ssh $SSH_OPTS $USER@$HOST << 'EOF'
# Create SSL directory
mkdir -p /opt/trading-ai/nginx/ssl

# Generate self-signed certificate for staging
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/trading-ai/nginx/ssl/server.key \
    -out /opt/trading-ai/nginx/ssl/server.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=staging.example.com"

# Set permissions
sudo chmod 644 /opt/trading-ai/nginx/ssl/server.crt
sudo chmod 600 /opt/trading-ai/nginx/ssl/server.key
EOF

# Create data directories
echo "Creating data directories..."
ssh $SSH_OPTS $USER@$HOST << 'EOF'
# Create directories
mkdir -p /opt/trading-ai/data/mongodb
mkdir -p /opt/trading-ai/data/redis
mkdir -p /opt/trading-ai/data/prometheus
mkdir -p /opt/trading-ai/data/grafana
mkdir -p /opt/trading-ai/logs/api
mkdir -p /opt/trading-ai/logs/ml
mkdir -p /opt/trading-ai/logs/agent
mkdir -p /opt/trading-ai/logs/data
mkdir -p /opt/trading-ai/logs/nginx
mkdir -p /opt/trading-ai/models
mkdir -p /opt/trading-ai/cache

# Set permissions
sudo chown -R 1000:1000 /opt/trading-ai/data/mongodb
sudo chown -R 1000:1000 /opt/trading-ai/data/redis
sudo chown -R 1000:1000 /opt/trading-ai/data/prometheus
sudo chown -R 1000:1000 /opt/trading-ai/data/grafana
sudo chown -R 1000:1000 /opt/trading-ai/logs
sudo chown -R 1000:1000 /opt/trading-ai/models
sudo chown -R 1000:1000 /opt/trading-ai/cache
EOF

# Pull Docker images
echo "Pulling Docker images..."
ssh $SSH_OPTS $USER@$HOST << 'EOF'
cd /opt/trading-ai
export TAG=staging
export ENVIRONMENT=staging
export DATABASE_URL=mongodb://trading_ai:staging_password@mongodb:27017/trading_ai?authSource=admin
export REDIS_URL=redis://:staging_password@redis:6379/0
export JWT_SECRET=staging_jwt_secret
export MONGO_USERNAME=trading_ai
export MONGO_PASSWORD=staging_password
export REDIS_PASSWORD=staging_password
export GLASSNODE_API_KEY=staging_glassnode_api_key
export CRYPTOQUANT_API_KEY=staging_cryptoquant_api_key
export INTOTHEBLOCK_API_KEY=staging_intotheblock_api_key
export GRAFANA_USERNAME=admin
export GRAFANA_PASSWORD=staging_grafana_password
sudo -E docker-compose -f docker-compose.yml pull
EOF

# Start services
echo "Starting services..."
ssh $SSH_OPTS $USER@$HOST << 'EOF'
cd /opt/trading-ai
export TAG=staging
export ENVIRONMENT=staging
export DATABASE_URL=mongodb://trading_ai:staging_password@mongodb:27017/trading_ai?authSource=admin
export REDIS_URL=redis://:staging_password@redis:6379/0
export JWT_SECRET=staging_jwt_secret
export MONGO_USERNAME=trading_ai
export MONGO_PASSWORD=staging_password
export REDIS_PASSWORD=staging_password
export GLASSNODE_API_KEY=staging_glassnode_api_key
export CRYPTOQUANT_API_KEY=staging_cryptoquant_api_key
export INTOTHEBLOCK_API_KEY=staging_intotheblock_api_key
export GRAFANA_USERNAME=admin
export GRAFANA_PASSWORD=staging_grafana_password
sudo -E docker-compose -f docker-compose.yml up -d
EOF

# Check service status
echo "Checking service status..."
ssh $SSH_OPTS $USER@$HOST "cd /opt/trading-ai && sudo docker-compose ps"

echo "Staging environment setup completed successfully!"
echo "You can access the staging environment at https://$HOST"
