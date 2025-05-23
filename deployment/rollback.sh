#!/bin/bash
# Rollback script for deployment

set -e

# Display usage information
function show_usage {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -e, --environment <env>   Environment to rollback (staging|production)"
    echo "  -v, --version <version>   Version to rollback to (tag or commit hash)"
    echo "  -c, --component <comp>    Component to rollback (api|ml|agent|data|all)"
    echo "  -h, --help                Show this help message"
    exit 1
}

# Parse command line arguments
ENVIRONMENT=""
VERSION=""
COMPONENT="all"

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        -v|--version)
            VERSION="$2"
            shift
            shift
            ;;
        -c|--component)
            COMPONENT="$2"
            shift
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
done

# Validate arguments
if [[ -z "$ENVIRONMENT" ]]; then
    echo "Error: Environment is required"
    show_usage
fi

if [[ -z "$VERSION" ]]; then
    echo "Error: Version is required"
    show_usage
fi

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "Error: Environment must be 'staging' or 'production'"
    show_usage
fi

if [[ "$COMPONENT" != "api" && "$COMPONENT" != "ml" && "$COMPONENT" != "agent" && "$COMPONENT" != "data" && "$COMPONENT" != "all" ]]; then
    echo "Error: Component must be 'api', 'ml', 'agent', 'data', or 'all'"
    show_usage
fi

# Load environment variables
if [[ "$ENVIRONMENT" == "staging" ]]; then
    ENV_FILE=".env.staging"
else
    ENV_FILE=".env.production"
fi

if [[ -f "$ENV_FILE" ]]; then
    source "$ENV_FILE"
else
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

# Set Docker image tags
API_IMAGE="trading-ai-api:$VERSION"
ML_IMAGE="trading-ai-ml:$VERSION"
AGENT_IMAGE="trading-ai-agent:$VERSION"
DATA_IMAGE="trading-ai-data:$VERSION"

# Perform rollback
echo "Rolling back $COMPONENT to version $VERSION in $ENVIRONMENT environment..."

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "api" ]]; then
    echo "Rolling back API service..."
    docker-compose -f deployment/docker-compose.yml stop api
    docker-compose -f deployment/docker-compose.yml rm -f api
    TAG=$VERSION docker-compose -f deployment/docker-compose.yml up -d api
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "ml" ]]; then
    echo "Rolling back ML service..."
    docker-compose -f deployment/docker-compose.yml stop ml-service
    docker-compose -f deployment/docker-compose.yml rm -f ml-service
    TAG=$VERSION docker-compose -f deployment/docker-compose.yml up -d ml-service
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "agent" ]]; then
    echo "Rolling back Agent service..."
    docker-compose -f deployment/docker-compose.yml stop agent-service
    docker-compose -f deployment/docker-compose.yml rm -f agent-service
    TAG=$VERSION docker-compose -f deployment/docker-compose.yml up -d agent-service
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "data" ]]; then
    echo "Rolling back Data Provider service..."
    docker-compose -f deployment/docker-compose.yml stop data-provider
    docker-compose -f deployment/docker-compose.yml rm -f data-provider
    TAG=$VERSION docker-compose -f deployment/docker-compose.yml up -d data-provider
fi

echo "Rollback completed successfully!"

# Verify rollback
echo "Verifying rollback..."
docker-compose -f deployment/docker-compose.yml ps

# Check service health
echo "Checking service health..."
sleep 10

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "api" ]]; then
    curl -s http://localhost:8000/health || echo "API service health check failed"
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "ml" ]]; then
    curl -s http://localhost:8001/health || echo "ML service health check failed"
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "agent" ]]; then
    curl -s http://localhost:8002/health || echo "Agent service health check failed"
fi

if [[ "$COMPONENT" == "all" || "$COMPONENT" == "data" ]]; then
    curl -s http://localhost:8003/health || echo "Data Provider service health check failed"
fi

echo "Rollback verification completed!"
