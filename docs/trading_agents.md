# Trading Agents Documentation

## Overview

The Trading Agents system is a modular framework for creating, managing, and monitoring automated trading agents. It integrates with the Sellyoursolv2 platform to provide a unified trading experience.

## Architecture

The Trading Agents system consists of the following components:

1. **Python Service**: A FastAPI application that manages agent lifecycle, configuration, and execution.
2. **Node.js Client**: A TypeScript client library for communicating with the Python service.
3. **React UI**: A user interface for managing and monitoring agents.

### System Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React UI  │────▶│  Node.js    │────▶│   Python    │
│             │◀────│   Backend   │◀────│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
                                        ┌─────────────┐
                                        │  External   │
                                        │    APIs     │
                                        └─────────────┘
```

## Agent Types

The system includes the following agent types:

### Copy Trading Agent

The Copy Trading Agent monitors and copies trades from successful wallets. It tracks transactions from specified wallets, analyzes them to find trending tokens, and opens positions based on those tokens.

**Key Features:**
- Track multiple wallets
- Filter tokens based on liquidity and holder concentration
- Automatic take profit and stop loss
- Position management

### Liquidation Agent

The Liquidation Agent monitors liquidation events and trades based on them. It tracks liquidation data for specified symbols and opens short positions when liquidation thresholds are met.

**Key Features:**
- Monitor multiple symbols
- Configurable liquidation thresholds
- Automatic take profit and stop loss
- Position management

### Scanner Agent

The Scanner Agent scans for promising tokens on the Solana blockchain. It tracks trending tokens, new token listings, and top traders for super cycle tokens.

**Key Features:**
- Track trending tokens
- Monitor new token listings
- Identify top traders
- Filter tokens based on configurable criteria

### Sniper Agent

The Sniper Agent snipes new tokens with potential for quick gains. It applies security and social media checks to identify promising tokens and opens positions based on those tokens.

**Key Features:**
- Security checks for token contracts
- Social media presence verification
- Automatic take profit and stop loss
- Position management

## User Guide

### Creating an Agent

1. Navigate to the Trading Agents page
2. Click the "Create Agent" button
3. Select an agent type
4. Enter a name for the agent
5. Configure the agent settings
6. Click "Create Agent"

### Managing Agents

#### Starting an Agent

1. Navigate to the Trading Agents page
2. Select the agent you want to start
3. Click the "Start Agent" button

#### Stopping an Agent

1. Navigate to the Trading Agents page
2. Select the agent you want to stop
3. Click the "Stop Agent" button

#### Updating an Agent

1. Navigate to the Trading Agents page
2. Select the agent you want to update
3. Click the settings icon
4. Update the agent name or configuration
5. Click "Update Agent"

#### Deleting an Agent

1. Navigate to the Trading Agents page
2. Select the agent you want to delete
3. Click the delete icon
4. Confirm the deletion

### Monitoring Agents

#### Viewing Agent Status

1. Navigate to the Trading Agents page
2. Select the agent you want to monitor
3. The agent status is displayed at the top of the agent details

#### Viewing Agent Metrics

1. Navigate to the Trading Agents page
2. Select the agent you want to monitor
3. Click the "Metrics" tab to view agent metrics

#### Viewing Agent Logs

1. Navigate to the Trading Agents page
2. Select the agent you want to monitor
3. Click the "Logs" tab to view agent logs

### Executing Agent Actions

1. Navigate to the Trading Agents page
2. Select the agent you want to execute an action on
3. Click the "Actions" tab
4. Select a predefined action or enter a custom action
5. Enter any required parameters
6. Click "Execute Action"

## API Reference

### Agent Management

#### Create Agent

```
POST /agents/
```

Request body:
```json
{
  "agent_type": "copy_trading",
  "name": "My Copy Trading Agent",
  "config": {
    "tracked_wallets": ["wallet1", "wallet2"],
    "check_interval_minutes": 10
  }
}
```

#### Get Agents

```
GET /agents/
```

#### Get Agent

```
GET /agents/{agent_id}
```

#### Update Agent

```
PUT /agents/{agent_id}
```

Request body:
```json
{
  "name": "Updated Agent Name",
  "config": {
    "check_interval_minutes": 5
  }
}
```

#### Delete Agent

```
DELETE /agents/{agent_id}
```

#### Start Agent

```
POST /agents/{agent_id}/start
```

#### Stop Agent

```
POST /agents/{agent_id}/stop
```

#### Get Agent Status

```
GET /agents/{agent_id}/status
```

#### Get Agent Logs

```
GET /agents/{agent_id}/logs
```

Query parameters:
- `limit`: Maximum number of logs to return (default: 100)
- `level`: Filter logs by level (info, warning, error, debug)

#### Execute Agent Action

```
POST /agents/{agent_id}/execute
```

Request body:
```json
{
  "type": "add_wallet",
  "parameters": {
    "wallet": "wallet_address"
  }
}
```

### Agent Types

#### Get Agent Types

```
GET /agent-types/
```

#### Get Agent Type

```
GET /agent-types/{agent_type}
```

## Troubleshooting

### Agent Not Starting

If an agent fails to start, check the following:

1. Check the agent logs for error messages
2. Verify that the agent configuration is valid
3. Ensure that the required API keys are set
4. Check that the agent service is running

### Agent Not Trading

If an agent is running but not trading, check the following:

1. Check the agent logs for error messages
2. Verify that the agent has sufficient balance
3. Ensure that the agent configuration is correct
4. Check that the agent has not reached its maximum positions

### API Connection Issues

If the frontend cannot connect to the agent API, check the following:

1. Verify that the agent service is running
2. Check that the API URL is correct
3. Ensure that the CORS settings are correct
4. Check for network connectivity issues
