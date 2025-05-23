
# SellYourSOL V2 AI Trading Platform

## Overview

SellYourSOL V2 is an advanced algorithmic trading platform for the Solana ecosystem. The platform leverages artificial intelligence to analyze market trends, track on-chain activity, and execute automated trading strategies with minimal latency.

## Core Features

- **Live Market Analysis**: Real-time tracking of Solana token prices and market movements
- **AI-Powered Trading**: Automated trading strategies utilizing machine learning algorithms
- **Wallet Integration**: Connect your Solana wallets for seamless transactions
- **Transaction Monitoring**: Track transaction history and portfolio performance
- **Webhook Integration**: Configure custom alerts and notifications for market events
- **API Management**: Connect to Helius and other Solana data providers
- **In-App Token Details**: View token details without leaving the application
- **Smart Money Wallet Tracking**: Track and analyze wallets of interest
- **MoonDev Trading AI Integration**: Advanced trading AI agents with distributed caching and performance monitoring
- **Machine Learning Integration**: Predictive analytics for price forecasting and reinforcement learning for strategy optimization
- **External System Integration**: Additional exchange integrations and on-chain data providers
- **Mobile Application**: Mobile interface for the trading platform with push notifications

## Target Users

- Cryptocurrency traders focused on the Solana ecosystem
- Investors looking for automated trading solutions
- Developers building on Solana who need market insights

## Technical Architecture

### Frontend
- **Framework**: React with TypeScript for type safety
- **Design System**: TailwindCSS with ShadcnUI components
- **State Management**: Zustand for global state
- **Charting**: Recharts for data visualization
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite with code-splitting and chunk optimization

### Backend
- **API Framework**: FastAPI with async support
- **Database**: PostgreSQL with optimized query patterns
- **Caching**: Multi-level caching system (memory, disk, distributed)
- **Execution Engine**: Adaptive task scheduling with concurrency control
- **Monitoring**: Real-time performance monitoring dashboard

### Data Providers
- **Blockchain Data**: Helius API for Solana blockchain data
- **Market Data**: Multiple exchange APIs with failover support
- **Analytics**: Custom analytics engine with machine learning models

## Getting Started

### Frontend Setup
1. Clone the repository
2. Install frontend dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Connect a wallet to access all features
5. Run frontend tests with `npm test`

### Backend Setup
1. Install Python 3.10 or higher
2. Install backend dependencies with `pip install -r requirements.txt`
3. Configure environment variables in `.env` file
4. Initialize the database with `python -m trading_agents.database.init_db`
5. Start the API server with `uvicorn trading_agents.api.app:app --host 0.0.0.0 --port 8000`
6. Access the API at `http://localhost:8000` and the dashboard at `http://localhost:8000/dashboard`
7. Run backend tests with `pytest trading_agents/tests`

### Docker Deployment
1. Build the Docker image with `docker build -t sellyoursolv2 .`
2. Start the services with `docker-compose up -d`
3. Access the application at `http://localhost:3000` and the API at `http://localhost:8000`

For detailed deployment instructions, see the [Deployment Guide](docs/deployment_guide.md).

## Configuration

The platform is preconfigured with Helius API integration. Users can add their own API keys in the Settings page.

## Recent Improvements

### MoonDev Trading AI Integration

The platform now integrates MoonDev's advanced trading AI agents, providing:

1. **Execution Engine Integration**: Efficiently executes trading agents with adaptive scheduling
2. **Database Optimization**: Optimized database operations for high-frequency trading
3. **Advanced Caching System**: Multi-level caching with distributed support and dependency tracking
4. **Performance Monitoring**: Real-time dashboard for system performance monitoring
5. **Startup Cache Warming**: Preloads critical data during system startup for improved performance

For detailed information, see the [MoonDev Integration Documentation](docs/moondev_integration.md).

### Machine Learning Integration

The platform now includes advanced machine learning capabilities:

1. **Predictive Analytics**: Machine learning models for price forecasting
2. **Reinforcement Learning**: Strategy optimization using reinforcement learning
3. **Feature Engineering**: Comprehensive feature extraction from market data
4. **Model Management**: Training, evaluation, and deployment of models

For detailed information, see the [Machine Learning Integration Documentation](docs/machine_learning_integration.md).

### External System Integration

The platform now integrates with additional external systems:

1. **Exchange Integrations**: Support for additional exchanges including Kraken
2. **On-Chain Data Providers**: Integration with blockchain data providers for on-chain metrics
3. **Alternative Data Sources**: Support for alternative data sources for trading signals

For detailed information, see the [External System Integration Documentation](docs/external_system_integration.md).

### Mobile Application

The platform now includes a mobile application:

1. **Mobile Interface**: Cross-platform mobile interface for the trading platform
2. **Push Notifications**: Real-time notifications for important events
3. **Agent Management**: Monitor and control trading agents from your mobile device
4. **Portfolio Tracking**: Track your portfolio and trading performance on the go

For detailed information, see the [Mobile App Integration Documentation](docs/mobile_app_integration.md).

### Bug Fixes and UI Enhancements

1. **Navigation Issue Fixed**: Fixed the "Analytics" button in the Wallet Tracking section
2. **Advanced Settings Button Fixed**: Improved navigation to advanced settings
3. **Consolidated Helius API Configuration**: Created a reusable component for API configuration
4. **Improved Token Detail Viewing**: Added in-app token details view
5. **Fixed Telegram Integration**: Enhanced authentication flow with better error handling
6. **Addressed Build Performance**: Implemented code-splitting and optimized chunk sizes

### Testing

- Added comprehensive test suite for new components and functionality
- Implemented test utilities for consistent testing
- Added integration tests for the MoonDev Trading AI integration
- Added performance tests to verify system performance under load

## Disclaimer

This platform is for educational and demonstration purposes. Always exercise caution when trading cryptocurrencies and never invest more than you can afford to lose.
