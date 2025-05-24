#!/bin/bash

# Trading Agents System Setup Script
# This script sets up the complete Trading Agents system for Sellyoursolv2

set -e  # Exit on any error

echo "🚀 Setting up Trading Agents System for Sellyoursolv2..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the Sellyoursolv2 root directory"
    exit 1
fi

print_status "Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) found"

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1-2)
print_success "Python $PYTHON_VERSION found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm $(npm --version) found"

print_status "Installing frontend dependencies..."

# Install frontend dependencies
npm install

print_success "Frontend dependencies installed"

print_status "Installing backend dependencies..."

# Install backend dependencies
cd backend
npm install
cd ..

print_success "Backend dependencies installed"

print_status "Setting up Trading Agents Service..."

# Create trading agents service directory if it doesn't exist
if [ ! -d "trading_agents_service" ]; then
    print_warning "Trading agents service directory not found. Creating..."
    mkdir -p trading_agents_service
fi

cd trading_agents_service

# Create Python virtual environment
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
print_status "Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

cd ..

print_success "Trading Agents Service setup complete"

print_status "Checking trading bot files..."

# Check if trading bot files exist
BOTS=("copybot.py" "solscanner.py" "hyperliquid_trading_bot.py" "sniperbot.py")
MISSING_BOTS=()

for bot in "${BOTS[@]}"; do
    if [ ! -f "$bot" ]; then
        MISSING_BOTS+=("$bot")
    fi
done

if [ ${#MISSING_BOTS[@]} -gt 0 ]; then
    print_warning "The following trading bot files are missing:"
    for bot in "${MISSING_BOTS[@]}"; do
        echo "  - $bot"
    done
    print_warning "Please ensure these files are in the root directory for full functionality."
else
    print_success "All trading bot files found"
fi

print_status "Creating startup scripts..."

# Create a comprehensive startup script
cat > start_trading_system.sh << 'EOF'
#!/bin/bash

# Comprehensive startup script for Trading Agents System

echo "🚀 Starting Trading Agents System..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "Port $1 is already in use"
        return 1
    fi
    return 0
}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "trading_agents_service" || true
pkill -f "backend/dist/server.js" || true
pkill -f "vite" || true

sleep 2

# Start Trading Agents Service
echo "Starting Trading Agents Service..."
cd trading_agents_service
source venv/bin/activate
python main.py &
TRADING_SERVICE_PID=$!
cd ..

# Wait for trading service to start
sleep 5

# Start Backend
echo "Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start Frontend
echo "Starting Frontend Development Server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Trading Agents System is starting up!"
echo "=================================================="
echo "Frontend:              http://localhost:5173"
echo "Backend:               http://localhost:3001"
echo "Trading Agents API:    http://localhost:8000"
echo "API Documentation:     http://localhost:8000/docs"
echo "=================================================="
echo ""
echo "Process IDs:"
echo "Trading Service: $TRADING_SERVICE_PID"
echo "Backend:         $BACKEND_PID"
echo "Frontend:        $FRONTEND_PID"
echo ""
echo "To stop all services, run: ./stop_trading_system.sh"
echo "Or press Ctrl+C to stop this script and manually kill processes"

# Wait for user interrupt
trap 'echo "Stopping all services..."; kill $TRADING_SERVICE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Keep script running
wait
EOF

# Create stop script
cat > stop_trading_system.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Trading Agents System..."

# Kill processes by name
pkill -f "trading_agents_service" || true
pkill -f "backend/dist/server.js" || true
pkill -f "vite" || true

# Kill processes on specific ports
lsof -ti:8000 | xargs kill -9 2>/dev/null || true  # Trading Agents Service
lsof -ti:3001 | xargs kill -9 2>/dev/null || true  # Backend
lsof -ti:5173 | xargs kill -9 2>/dev/null || true  # Frontend

echo "✅ All services stopped"
EOF

# Make scripts executable
chmod +x start_trading_system.sh
chmod +x stop_trading_system.sh

print_success "Startup scripts created"

print_status "Building backend..."

# Build backend
cd backend
npm run build
cd ..

print_success "Backend built successfully"

print_status "Setup complete! 🎉"
echo ""
echo "=================================================="
echo "Trading Agents System Setup Complete!"
echo "=================================================="
echo ""
echo "📁 Project Structure:"
echo "  ├── src/                     (Frontend React components)"
echo "  ├── backend/                 (Node.js API server)"
echo "  ├── trading_agents_service/  (Python FastAPI service)"
echo "  ├── *.py                     (Trading bot scripts)"
echo "  └── start_trading_system.sh  (Startup script)"
echo ""
echo "🚀 To start the system:"
echo "  ./start_trading_system.sh"
echo ""
echo "🛑 To stop the system:"
echo "  ./stop_trading_system.sh"
echo ""
echo "🌐 Access URLs (after starting):"
echo "  Frontend:              http://localhost:5173"
echo "  Backend API:           http://localhost:3001"
echo "  Trading Agents API:    http://localhost:8000"
echo "  API Documentation:     http://localhost:8000/docs"
echo ""
echo "📖 Navigation:"
echo "  Go to http://localhost:5173/trading-agents to access the Trading Agents page"
echo ""

if [ ${#MISSING_BOTS[@]} -gt 0 ]; then
    print_warning "Note: Some trading bot files are missing. Please add them for full functionality."
fi

echo "✅ Setup completed successfully!"
