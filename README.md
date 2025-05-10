
# SellYourSOL V2 AI Trading Platform

![SellYourSOL v2](https://via.placeholder.com/800x400?text=SellYourSOL+v2)

## Overview
SellYourSOL V2 is an advanced algorithmic trading platform for the Solana ecosystem. The platform leverages artificial intelligence to analyze market trends, track on-chain activity, and execute automated trading strategies with minimal latency.

## Core Features
- **Live Market Analysis**: Real-time tracking of Solana token prices and market movements
- **AI-Powered Trading**: Automated trading strategies utilizing machine learning algorithms
- **Wallet Integration**: Connect your Solana wallets for seamless transactions
- **Transaction Monitoring**: Track transaction history and portfolio performance
- **Webhook Integration**: Configure custom alerts and notifications for market events
- **API Management**: Connect to Helius and other Solana data providers
- **Multi-wallet Support**: Compatible with Phantom, Solflare, and other Solana wallets
- **Dark Mode UI**: Optimized for extended trading sessions

## Target Users
- Cryptocurrency traders focused on the Solana ecosystem
- Investors looking for automated trading solutions
- Developers building on Solana who need market insights

## Technical Architecture
- **Frontend**: React 18 with TypeScript for type safety
- **Design System**: TailwindCSS with ShadcnUI components
- **Data Provider**: Helius API for Solana blockchain data
- **State Management**: Zustand for global state
- **Authentication**: Wallet-based authentication with session management
- **Charting**: Recharts for data visualization
- **Testing**: Vitest for unit and component testing

## Prerequisites

- Node.js 18+ and npm
- A Solana wallet (Phantom, Solflare, etc.)
- API keys for Helius (optional, demo keys included)

## Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/sellyoursolv2.git
cd sellyoursolv2
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory based on the `.env.example` file:

```bash
cp .env.example .env
```

Edit the `.env` file to add your API keys:

```
VITE_HELIUS_API_KEY=your-helius-api-key
VITE_BIRDEYE_API_KEY=your-birdeye-api-key
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Start the development server**

```bash
npm run dev
```

5. **Open the application**

Navigate to `http://localhost:5173` in your browser.

## Testing

Run the test suite with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
sellyoursolv2/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── config/          # Application configuration
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Third-party integrations
│   ├── lib/             # Utility libraries
│   ├── pages/           # Page components
│   ├── services/        # API and data services
│   ├── store/           # Zustand state stores
│   ├── styles/          # Global styles
│   ├── test/            # Test utilities
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── .env.example         # Example environment variables
├── index.html           # HTML entry point
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Key Components

### Authentication

The application uses wallet-based authentication with secure session management. Users can connect their Solana wallets and authenticate with a signature.

```typescript
// Connect a wallet
import { useAuth } from '@/contexts/AuthContext';

const { signIn } = useAuth();
await signIn('Phantom');
```

### State Management

Zustand is used for global state management with separate stores for different concerns:

```typescript
// Use token store
import { useTokenStore } from '@/store/tokenStore';

const { tokens, fetchTokens } = useTokenStore();
```

### API Integration

The application integrates with Helius API for Solana blockchain data:

```typescript
// Fetch token data
import { getRecentTokenActivity } from '@/services/tokenDataService';

const tokens = await getRecentTokenActivity();
```

## Configuration

The application can be configured through the Settings page or by editing the `src/config/appDefinition.ts` file.

### API Keys

Users can add their own API keys in the Settings page. The application comes with demo API keys for testing.

### Trading Settings

Trading settings can be configured in the Auto Trading page, including:

- Risk level
- Auto-secure initial investment
- Slippage tolerance

## Disclaimer

This platform is for educational and demonstration purposes. Always exercise caution when trading cryptocurrencies and never invest more than you can afford to lose.

## License

MIT
