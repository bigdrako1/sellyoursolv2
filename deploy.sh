#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Make scripts executable
chmod +x scripts/*.sh

# Create directories if they don't exist
mkdir -p nginx/ssl

# Check if SSL certificates exist
if [ ! -f nginx/ssl/sellyoursolv2.com.crt ] || [ ! -f nginx/ssl/sellyoursolv2.com.key ]; then
    echo "Warning: SSL certificates not found"
    echo "For production, please place your SSL certificates in nginx/ssl/"
    echo "For development, self-signed certificates will be generated"
    
    # Generate self-signed certificates for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/sellyoursolv2.com.key \
        -out nginx/ssl/sellyoursolv2.com.crt \
        -subj "/CN=sellyoursolv2.com" \
        -addext "subjectAltName=DNS:sellyoursolv2.com,DNS:www.sellyoursolv2.com"
fi

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking if services are running..."
if docker-compose ps | grep -q "Exit"; then
    echo "Error: Some services failed to start"
    docker-compose logs
    exit 1
fi

echo "Deployment completed successfully!"
echo "The application is now running at https://sellyoursolv2.com"
