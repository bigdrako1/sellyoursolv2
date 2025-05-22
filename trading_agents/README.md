# MoonDev Trading AI Agents

This repository contains a modular framework for creating and managing trading agents for the Sellyoursolv2 platform.

## Overview

The MoonDev Trading AI Agents framework provides a flexible and extensible architecture for developing, deploying, and managing trading agents. It includes:

- A core agent framework with lifecycle management, configuration handling, and common functionality
- A REST API for agent management
- WebSocket support for real-time updates
- Integration with external data sources and execution services
- Built-in agent types for common trading strategies

## Architecture

The framework is organized into the following components:

- **Core**: Base classes and utilities for agent development
- **Agents**: Implementations of specific trading strategies
- **API**: REST API for agent management
- **Services**: Services for market data, execution, and position management
- **Clients**: Clients for external APIs

## Agent Types

The framework includes the following built-in agent types:

- **Copy Trading Agent**: Monitors and copies trades from successful wallets
- **Liquidation Agent**: Monitors liquidation events and trades based on them
- **Scanner Agent**: Scans for promising tokens on the Solana blockchain
- **Sniper Agent**: Snipes new tokens with potential for quick gains

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/trading-agents.git
cd trading-agents
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

## Usage

### Starting the API Server

```bash
python main.py
```

### Creating an Agent

```bash
curl -X POST "http://localhost:8000/agents/" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_type": "copy_trading",
    "name": "My Copy Trading Agent",
    "config": {
      "tracked_wallets": ["wallet1", "wallet2"],
      "check_interval_minutes": 10,
      "max_positions": 5,
      "position_size_usd": 20
    }
  }'
```

### Getting Agent Status

```bash
curl -X GET "http://localhost:8000/agents/{agent_id}/status"
```

### Starting an Agent

```bash
curl -X POST "http://localhost:8000/agents/{agent_id}/start"
```

### Stopping an Agent

```bash
curl -X POST "http://localhost:8000/agents/{agent_id}/stop"
```

## Development

### Creating a New Agent Type

1. Create a new file in the `agents` directory:
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

2. Register the agent type in `core/agent_factory.py`:
```python
from agents.my_custom_agent import MyCustomAgent

AgentFactory.register_agent_type("my_custom", MyCustomAgent)
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
