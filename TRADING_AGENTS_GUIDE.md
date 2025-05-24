# Trading Agents System - Complete Implementation Guide

## Overview

The Trading Agents system is a comprehensive integration that brings automated Python trading bots into the Sellyoursolv2 platform. This system provides a unified interface for managing, monitoring, and controlling multiple trading bots from a single dashboard.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sellyoursolv2 Frontend                  │
│                  (React + TypeScript)                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Trading Agents Page                      │   │
│  │  • Agent Management Dashboard                       │   │
│  │  • Real-time Status Monitoring                     │   │
│  │  • Configuration Interface                         │   │
│  │  • Logs Viewer                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Node.js Backend API                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Trading Agents Routes                       │   │
│  │  • Proxy to Python Service                         │   │
│  │  • Authentication & Authorization                  │   │
│  │  • Request/Response Processing                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Python Trading Agents Service                 │
│                     (FastAPI)                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Process Management                        │   │
│  │  • Start/Stop Python Bots                         │   │
│  │  • Configuration Management                        │   │
│  │  • Real-time Monitoring                           │   │
│  │  • Logging & WebSocket Updates                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ subprocess
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Python Trading Bots                       │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────┐ │
│  │  Copy Bot   │ │ SOL Scanner │ │ HyperLiquid │ │Sniper │ │
│  │             │ │             │ │   Trading   │ │  Bot  │ │
│  │ copybot.py  │ │solscanner.py│ │    Bot      │ │       │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Setup
```bash
# Run the setup script
./setup_trading_agents.sh
```

### 2. Start the System
```bash
# Start all services
./start_trading_system.sh
```

### 3. Access the Interface
- **Frontend**: http://localhost:5173/trading-agents
- **API Documentation**: http://localhost:8000/docs

## 📋 Features

### ✅ Implemented Features

#### Frontend Components
- **Trading Agents Page** (`/trading-agents`)
  - Tabbed interface (All Agents, Running Agents, Logs, Settings)
  - Real-time status monitoring
  - Agent performance metrics display
  - Service health status indicator

- **Agent Management**
  - Create new trading agents
  - Edit agent configurations
  - Start/stop agents with one click
  - Delete agents with confirmation

- **Agent Cards**
  - Visual status indicators
  - Performance metrics (trades, win rate, P&L, uptime)
  - Quick action buttons
  - Dropdown menu for advanced actions

- **Configuration Dialog**
  - Dynamic form generation based on agent type
  - Input validation and error handling
  - Support for different field types (number, boolean, select)

- **Logs Viewer**
  - Real-time log streaming
  - Log level filtering
  - Search functionality
  - Export logs to file
  - Auto-refresh capability

#### Backend Integration
- **Node.js API Routes** (`/api/trading-agents`)
  - Proxy to Python service
  - Authentication middleware
  - Error handling and response formatting

- **Python FastAPI Service**
  - RESTful API for agent management
  - WebSocket support for real-time updates
  - Process management for Python bots
  - Configuration file handling
  - Logging system

#### Supported Trading Bots
1. **Copy Trading Bot** (`copybot.py`)
2. **SOL Scanner** (`solscanner.py`)
3. **HyperLiquid Trading Bot** (`hyperliquid_trading_bot.py`)
4. **Sniper Bot** (`sniperbot.py`)

## 🔧 Configuration

### Agent Types and Default Configurations

#### Copy Trading Bot
```json
{
  "max_positions": 10,
  "usdc_size": 100,
  "days_back": 1,
  "tp_multiplier": 2.0,
  "sl_percentage": -0.5
}
```

#### SOL Scanner
```json
{
  "new_token_hours": 3,
  "min_liquidity": 10000,
  "max_top10_holder_percent": 0.3,
  "drop_if_no_website": false,
  "drop_if_no_twitter": false
}
```

#### HyperLiquid Trading Bot
```json
{
  "order_usd_size": 10,
  "leverage": 3,
  "timeframe": "4h",
  "symbols": ["WIF"],
  "liquidation_threshold": 10000
}
```

#### Sniper Bot
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

## 📁 File Structure

```
sellyoursolv2/
├── src/
│   ├── pages/
│   │   └── TradingAgents.tsx              # Main trading agents page
│   ├── components/
│   │   └── trading-agents/
│   │       ├── AgentCard.tsx              # Individual agent card
│   │       ├── AgentConfigDialog.tsx      # Configuration dialog
│   │       └── AgentLogsViewer.tsx        # Logs viewer component
│   └── services/
│       └── tradingAgentsService.ts        # API service functions
├── backend/
│   └── src/
│       └── routes/
│           └── tradingAgentsRoutes.ts     # Node.js API routes
├── trading_agents_service/
│   ├── main.py                            # FastAPI service
│   ├── requirements.txt                   # Python dependencies
│   ├── start_service.sh                   # Service startup script
│   └── README.md                          # Service documentation
├── copybot.py                             # Copy trading bot
├── solscanner.py                          # SOL scanner bot
├── hyperliquid_trading_bot.py             # HyperLiquid trading bot
├── sniperbot.py                           # Sniper bot
├── setup_trading_agents.sh                # Complete setup script
├── start_trading_system.sh                # System startup script
├── stop_trading_system.sh                 # System shutdown script
└── TRADING_AGENTS_GUIDE.md               # This documentation
```

## 🔌 API Endpoints

### Trading Agents Service (Port 8000)

#### Agent Management
- `GET /agents` - List all agents
- `POST /agents` - Create new agent
- `GET /agents/{id}` - Get agent details
- `PUT /agents/{id}` - Update agent
- `DELETE /agents/{id}` - Delete agent

#### Agent Control
- `POST /agents/{id}/start` - Start agent
- `POST /agents/{id}/stop` - Stop agent
- `GET /agents/{id}/status` - Get status

#### Monitoring
- `GET /agents/{id}/logs` - Get logs
- `WS /agents/{id}/ws` - WebSocket updates

### Node.js Backend (Port 3002) - UNIFIED ENDPOINTS
- `GET /api/agents/*` - Proxied endpoints (consolidated from /api/trading-agents)
- Authentication required for all endpoints
- All agent management now uses single `/api/agents` endpoint

## 🎯 Usage Guide

### Creating a New Trading Agent

1. **Navigate to Agents page**
   - Go to http://localhost:3000/agents

2. **Click "Create Agent"**
   - Opens the configuration dialog

3. **Configure the Agent**
   - Enter agent name
   - Select agent type
   - Configure parameters
   - Click "Create Agent"

### Managing Existing Agents

1. **View All Agents**
   - See status, performance metrics
   - Quick start/stop actions

2. **Edit Configuration**
   - Click the dropdown menu on agent card
   - Select "Edit Configuration"
   - Modify settings and save

3. **View Logs**
   - Click "View Logs" from dropdown
   - Real-time log streaming
   - Filter by log level
   - Export logs

### Monitoring Running Agents

1. **Running Agents Tab**
   - Shows only active agents
   - Real-time status updates

2. **Performance Metrics**
   - Total trades executed
   - Win rate percentage
   - Profit/Loss tracking
   - Uptime statistics

## 🔍 Troubleshooting

### Common Issues

1. **Service Not Starting**
   ```bash
   # Check if ports are in use
   lsof -i :8000  # Trading service
   lsof -i :3001  # Backend
   lsof -i :5173  # Frontend

   # Kill processes if needed
   ./stop_trading_system.sh
   ```

2. **Agent Won't Start**
   - Check if Python bot file exists
   - Verify configuration parameters
   - Check service logs at http://localhost:8000/docs

3. **Frontend Not Loading**
   - Ensure all services are running
   - Check browser console for errors
   - Verify API connectivity

### Debug Mode

1. **Enable Debug Logging**
   ```bash
   # In trading_agents_service/main.py
   logging.basicConfig(level=logging.DEBUG)
   ```

2. **Check Service Health**
   ```bash
   curl http://localhost:8000/health
   ```

3. **View API Documentation**
   - Visit http://localhost:8000/docs
   - Test endpoints directly

## 🔒 Security Considerations

1. **Process Isolation**
   - Each bot runs in separate process
   - Configuration files are isolated
   - Process monitoring and cleanup

2. **Input Validation**
   - All configuration inputs validated
   - Type checking and range validation
   - SQL injection prevention

3. **Authentication**
   - Inherits from main platform
   - JWT token validation
   - Role-based access control

## 🚀 Future Enhancements

### Planned Features
1. **Database Integration**
   - Persistent agent storage
   - Historical performance data
   - Configuration versioning

2. **Advanced Monitoring**
   - Performance charts
   - Alert system
   - Resource usage tracking

3. **Bot Marketplace**
   - Community bot sharing
   - Bot templates
   - Version management

4. **Enhanced Security**
   - Sandboxed execution
   - Resource limits
   - Audit logging

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at http://localhost:8000/docs
3. Check service logs and status
4. Verify all dependencies are installed

## 🎉 Success!

You now have a fully functional Trading Agents system integrated into Sellyoursolv2! The system provides:

- ✅ Unified dashboard for all trading bots
- ✅ Real-time monitoring and control
- ✅ Configuration management
- ✅ Comprehensive logging
- ✅ WebSocket-based live updates
- ✅ Professional UI/UX design

Navigate to http://localhost:5173/trading-agents to start managing your automated trading bots!
