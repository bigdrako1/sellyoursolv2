
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

## Target Users

- Cryptocurrency traders focused on the Solana ecosystem
- Investors looking for automated trading solutions
- Developers building on Solana who need market insights

## Technical Architecture

- **Frontend**: React with TypeScript for type safety
- **Design System**: TailwindCSS with ShadcnUI components
- **Data Provider**: Helius API for Solana blockchain data
- **State Management**: Zustand for global state
- **Charting**: Recharts for data visualization
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite with code-splitting and chunk optimization

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Connect a wallet to access all features
5. Run tests with `npm test`

## Configuration

The platform is preconfigured with Helius API integration. Users can add their own API keys in the Settings page.

## Recent Improvements

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

## Disclaimer

This platform is for educational and demonstration purposes. Always exercise caution when trading cryptocurrencies and never invest more than you can afford to lose.
