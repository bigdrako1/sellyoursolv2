# Trading Agents Service

A FastAPI-based backend service for managing Python trading bot processes within the Sellyoursolv2 platform.

## Overview

This service provides a REST API and WebSocket interface for:
- Creating, updating, and deleting trading agents
- Starting and stopping Python trading bot processes
- Real-time monitoring and logging
- Configuration management for different bot types

## Supported Trading Bots

The service integrates with the following Python trading bots:

1. **Copy Trading Bot** (`copybot.py`)
   - Automatically copies trades from successful wallets
   - Monitors smart money movements

2. **SOL Scanner** (`solscanner.py`)
   - Scans for new token launches on Solana
   - Applies quality filters and security checks

3. **HyperLiquid Trading Bot** (`hyperliquid_trading_bot.py`)
   - Trades liquidations and market inefficiencies
   - Operates on HyperLiquid exchange

4. **Sniper Bot** (`sniperbot.py`)
   - Snipes new token launches
   - Advanced security checks and filters

## Installation

1. **Install Python 3.8+**
   ```bash
   # Check Python version
   python3 --version
   ```

2. **Install dependencies**
   ```bash
   cd trading_agents_service
   pip install -r requirements.txt
   ```

3. **Start the service**
   ```bash
   # Using the startup script
   ./start_service.sh
   
   # Or manually
   python main.py
   ```

The service will start on `http://localhost:8000`

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Agent Management
- `GET /agents` - List all trading agents
- `POST /agents` - Create a new trading agent
- `GET /agents/{agent_id}` - Get specific agent details
- `PUT /agents/{agent_id}` - Update agent configuration
- `DELETE /agents/{agent_id}` - Delete an agent

### Agent Control
- `POST /agents/{agent_id}/start` - Start a trading agent
- `POST /agents/{agent_id}/stop` - Stop a trading agent
- `GET /agents/{agent_id}/status` - Get agent status

### Logs and Monitoring
- `GET /agents/{agent_id}/logs` - Get agent logs
- `WS /agents/{agent_id}/ws` - WebSocket for real-time updates

### Utility
- `GET /agents/types` - Get available agent types

## Configuration

Each trading bot type has its own configuration schema:

### Copy Trading Bot
```json
{
  "max_positions": 10,
  "usdc_size": 100,
  "days_back": 1,
  "tp_multiplier": 2.0,
  "sl_percentage": -0.5
}
```

### SOL Scanner
```json
{
  "new_token_hours": 3,
  "min_liquidity": 10000,
  "max_top10_holder_percent": 0.3,
  "drop_if_no_website": false,
  "drop_if_no_twitter": false
}
```

### HyperLiquid Trading Bot
```json
{
  "order_usd_size": 10,
  "leverage": 3,
  "timeframe": "4h",
  "symbols": ["WIF"],
  "liquidation_threshold": 10000
}
```

### Sniper Bot
```json
{
  "usdc_size": 100,
  "max_positions": 5,
  "sell_at_multiple": 4.0,
  "sell_amount_perc": 0.8,
  "max_top10_holder_percent": 0.3,
  "drop_if_mutable_metadata": true
}
```

## Integration with Sellyoursolv2

The service is designed to work with the Sellyoursolv2 platform:

1. **Node.js Backend Proxy**: The main Node.js backend proxies requests to this service
2. **Frontend Integration**: React components communicate through the Node.js API
3. **Real-time Updates**: WebSocket connections provide live status updates
4. **Authentication**: Inherits authentication from the main platform

## Development

### Running in Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Logs
The service logs to stdout. In production, configure proper log rotation and storage.

## Production Deployment

For production deployment:

1. **Use a process manager** (e.g., systemd, supervisor, PM2)
2. **Configure reverse proxy** (nginx, Apache)
3. **Set up proper logging** and monitoring
4. **Use a real database** instead of in-memory storage
5. **Implement proper security** measures

## Security Considerations

- The service runs Python scripts with subprocess - ensure proper sandboxing
- Validate all configuration inputs
- Implement rate limiting for API endpoints
- Use HTTPS in production
- Restrict file system access for bot processes

## Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   ```bash
   # Find and kill process using port 8000
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python bot scripts not found**
   - Ensure bot scripts are in the same directory as the service
   - Check file permissions

3. **Permission denied errors**
   - Ensure the service has permission to create/delete files
   - Check Python script execution permissions

### Logs and Debugging

- Check service logs for error messages
- Use the `/health` endpoint to verify service status
- Monitor agent logs through the API or WebSocket connections
