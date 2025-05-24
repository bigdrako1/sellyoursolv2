#!/bin/bash
# Development environment setup script

set -e

# Create .env file for development
echo "Creating .env file for development..."
cat > .env << EOF
# Environment
ENVIRONMENT=development

# Database
MONGO_USERNAME=trading_ai
MONGO_PASSWORD=dev_password
DATABASE_URL=mongodb://trading_ai:dev_password@localhost:27017/trading_ai?authSource=admin

# Redis
REDIS_PASSWORD=dev_password
REDIS_URL=redis://:dev_password@localhost:6379/0

# JWT
JWT_SECRET=dev_jwt_secret

# API Keys
GLASSNODE_API_KEY=dev_glassnode_api_key
CRYPTOQUANT_API_KEY=dev_cryptoquant_api_key
INTOTHEBLOCK_API_KEY=dev_intotheblock_api_key

# Grafana
GRAFANA_USERNAME=admin
GRAFANA_PASSWORD=dev_grafana_password

# Logging
LOG_LEVEL=debug
EOF

# Start MongoDB and Redis using Docker
echo "Starting MongoDB and Redis..."
docker run -d --name trading-ai-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=trading_ai \
  -e MONGO_INITDB_ROOT_PASSWORD=dev_password \
  mongo:5.0

docker run -d --name trading-ai-redis \
  -p 6379:6379 \
  redis:6.2-alpine redis-server --requirepass dev_password

# Create directories
echo "Creating directories..."
mkdir -p logs/api
mkdir -p logs/ml
mkdir -p logs/agent
mkdir -p logs/data
mkdir -p models
mkdir -p cache

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r trading_agents/requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Create a script to start the backend services
echo "Creating start_backend.sh script..."
cat > start_backend.sh << EOF
#!/bin/bash
# Start backend services

# Start API service
python -m trading_agents.api.app &
API_PID=\$!

# Start ML service
python -m trading_agents.ml.api &
ML_PID=\$!

# Start Agent service
python -m trading_agents.agent.api &
AGENT_PID=\$!

# Start Data Provider service
python -m trading_agents.data.api &
DATA_PID=\$!

# Wait for all services to exit
wait \$API_PID \$ML_PID \$AGENT_PID \$DATA_PID
EOF
chmod +x start_backend.sh

# Create a script to start the frontend
echo "Creating start_frontend.sh script..."
cat > start_frontend.sh << EOF
#!/bin/bash
# Start frontend

npm run dev
EOF
chmod +x start_frontend.sh

# Create a script to start the mobile app
echo "Creating start_mobile.sh script..."
cat > start_mobile.sh << EOF
#!/bin/bash
# Start mobile app

cd mobile
npm start
EOF
chmod +x start_mobile.sh

# Create a script to stop all services
echo "Creating stop_all.sh script..."
cat > stop_all.sh << EOF
#!/bin/bash
# Stop all services

# Stop backend services
pkill -f "python -m trading_agents" || true

# Stop MongoDB and Redis
docker stop trading-ai-mongodb || true
docker stop trading-ai-redis || true
docker rm trading-ai-mongodb || true
docker rm trading-ai-redis || true
EOF
chmod +x stop_all.sh

echo "Development environment setup completed!"
echo "To start the backend services, run: ./start_backend.sh"
echo "To start the frontend, run: ./start_frontend.sh"
echo "To start the mobile app, run: ./start_mobile.sh"
echo "To stop all services, run: ./stop_all.sh"
