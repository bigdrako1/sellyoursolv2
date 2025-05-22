# Development Guide

This guide provides instructions for setting up the development environment, running tests, and contributing to the project.

## Prerequisites

- Node.js 18 or later
- Python 3.10 or later
- Docker and Docker Compose
- Git

## Setup

### Clone the Repository

```bash
git clone https://github.com/your-username/sellyoursolv2.git
cd sellyoursolv2
```

### Environment Variables

Create a `.env` file based on the `.env.example` file:

```bash
cp .env.example .env
```

Edit the `.env` file to set your API keys and other configuration options.

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

### Trading Agents Setup

```bash
cd trading_agents
pip install -r requirements.txt
```

## Development

### Running the Backend

```bash
cd backend
npm run dev
```

### Running the Frontend

```bash
cd frontend
npm run dev
```

### Running the Trading Agents Service

```bash
cd trading_agents
python main.py
```

### Running with Docker Compose

You can also run the entire application using Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Trading Agents Tests

```bash
cd trading_agents
pytest
```

## Creating a New Agent Type

To create a new agent type, follow these steps:

1. Create a new file in the `trading_agents/agents` directory:

```python
from core.base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    async def _initialize(self):
        # Initialize agent resources
        pass
        
    async def _cleanup(self):
        # Clean up agent resources
        pass
        
    async def _on_config_update(self, old_config, new_config):
        # Handle configuration updates
        pass
```

2. Register the agent type in `trading_agents/core/agent_factory.py`:

```python
from agents.my_custom_agent import MyCustomAgent

AgentFactory.register_agent_type("my_custom", MyCustomAgent)
```

3. Add the agent type to the agent types API in `trading_agents/api/routes/agent_types_routes.py`.

4. Add the agent type to the frontend predefined actions in `src/components/trading-agents/AgentActions.tsx`.

## Code Style

### Backend and Frontend

We use ESLint and Prettier for code style. Run the following commands to check and fix code style:

```bash
# Check code style
npm run lint

# Fix code style
npm run lint:fix
```

### Trading Agents

We use flake8 and black for code style. Run the following commands to check and fix code style:

```bash
# Check code style
flake8 trading_agents

# Fix code style
black trading_agents
```

## Pull Request Process

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run the tests to ensure they pass
5. Submit a pull request

## Deployment

### Production Deployment

To deploy to production, run the deployment script:

```bash
./deploy.sh
```

This will build and deploy the application using Docker Compose.

### CI/CD

The project uses GitHub Actions for CI/CD. When you push to the main branch, the CI/CD pipeline will:

1. Run the tests
2. Build the Docker images
3. Push the Docker images to Docker Hub
4. Deploy the application to the production server

## Architecture

### Backend

The backend is a Node.js application built with Express. It provides a REST API for the frontend and communicates with the trading agents service.

### Frontend

The frontend is a React application built with Vite. It provides a user interface for managing and monitoring trading agents.

### Trading Agents

The trading agents service is a Python application built with FastAPI. It manages agent lifecycle, configuration, and execution.

## Directory Structure

```
sellyoursolv2/
├── backend/             # Node.js backend
├── frontend/            # React frontend
├── trading_agents/      # Python trading agents service
├── docs/                # Documentation
├── nginx/               # Nginx configuration
├── scripts/             # Deployment scripts
├── .github/             # GitHub Actions workflows
├── docker-compose.yml   # Docker Compose configuration
└── .env.example         # Example environment variables
```

## Troubleshooting

### Docker Issues

If you encounter issues with Docker, try the following:

1. Restart Docker
2. Remove all containers and images:

```bash
docker-compose down
docker system prune -a
```

3. Rebuild the containers:

```bash
docker-compose up --build
```

### Database Issues

If you encounter issues with the database, try the following:

1. Reset the database:

```bash
docker-compose down -v
docker-compose up
```

2. Check the database logs:

```bash
docker-compose logs postgres
```

### API Issues

If you encounter issues with the API, try the following:

1. Check the API logs:

```bash
docker-compose logs backend
docker-compose logs trading-agents
```

2. Verify that the API is running:

```bash
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```
