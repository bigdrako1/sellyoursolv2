
/**
 * SellYourSOL V2 AI Platform Configuration
 * Central configuration for branding, features, and app settings
 */

export const APP_CONFIG = {
  // App branding
  name: "SellYourSOL V2 AI",
  shortName: "SYS V2",
  description: "Advanced AI-powered trading platform for the Solana ecosystem",
  version: "2.0.0",

  // Theme configuration
  theme: {
    primaryColor: "trading-highlight", // Maps to tailwind config
    secondaryColor: "trading-secondary",
    accentColor: "trading-primary",
    darkMode: true,
  },

  // Feature flags
  features: {
    autoTrading: true,
    portfolioTracking: true,
    marketAnalysis: true,
    webhookIntegration: true,
    apiConfiguration: true,
    multiWallet: true,
  },

  // API Configuration
  api: {
    provider: "Helius",
    // Production endpoints
    production: {
      baseUrl: "https://api.helius.xyz/v1",
      rpcUrl: "https://mainnet.helius-rpc.com",
      wsUrl: "wss://mainnet.helius-rpc.com",
      apiKey: import.meta.env.VITE_HELIUS_API_KEY || "a18d2c93-d9fa-4db2-8419-707a4f1782f7",
      environment: "production",
    },
    // Development endpoints
    development: {
      baseUrl: "https://api-devnet.helius-rpc.com/v0",
      rpcUrl: "https://devnet.helius-rpc.com",
      wsUrl: "wss://devnet.helius-rpc.com",
      secureRpcUrl: "https://dominga-id818f-fast-devnet.helius-rpc.com",
      stakedRpcUrl: "https://staked.helius-rpc.com",
      apiKey: import.meta.env.VITE_HELIUS_DEV_API_KEY || "e4a78345-f927-4ed9-b33e-2ca970b1063e",
      environment: "development",
    },
    // Set environment based on env variable or default to production
    environment: import.meta.env.VITE_APP_ENV === "development" ? "development" : "production",
    defaultApiKey: import.meta.env.VITE_HELIUS_API_KEY || "a18d2c93-d9fa-4db2-8419-707a4f1782f7",
    personalApiKeyDescription: "Your personal API key is used for authentication with Helius API services and to increase rate limits above the default tier. It ensures your requests are prioritized and allows access to premium features."
  },

  // Trading configuration
  trading: {
    defaultRouting: "jupiter",
    minLiquidityThreshold: 10000,
    qualityScoreThreshold: 70,
    autoSecureInitial: true,
    dexes: {
      jupiter: {
        apiUrl: "https://quote-api.jup.ag/v6",
        swapUrl: "https://jup.ag/swap",
        enabled: true
      },
      raydium: {
        enabled: true,
        swapUrl: "https://raydium.io/swap"
      },
      orca: {
        enabled: false
      }
    }
  },

  // Jupiter configuration
  jupiter: {
    apiUrl: "https://quote-api.jup.ag/v6",
    priceApiUrl: "https://price.jup.ag/v4",
    swapUrl: "https://jup.ag/swap",
    defaultSlippage: 0.5, // 0.5%
  },

  // Supported currencies
  currencies: [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "KES", symbol: "KSh", name: "Kenya Shilling" }
  ],

  // Default currency
  defaultCurrency: "USD",

  // Contact information
  contact: {
    support: "support@sellyoursol.ai",
    twitter: "@SellYourSOL_AI",
    telegram: "t.me/SellYourSOL"
  },

  // Connected services status tracking
  connectedServices: {
    solanaRpc: {
      name: "Solana RPC",
      description: "Direct connection to the Solana blockchain for real-time transaction data",
      colorCode: "text-green-500"
    },
    heliusApi: {
      name: "Helius API",
      description: "Enhanced blockchain data, token metadata, and advanced analytics",
      colorCode: "text-blue-500"
    },
    jupiterApi: {
      name: "Jupiter API",
      description: "Routing trades and price discovery",
      colorCode: "text-purple-500"
    },
    webhooks: {
      name: "Webhooks",
      description: "Real-time event notifications for blockchain activity",
      colorCode: "text-purple-500"
    }
  }
};

/**
 * Get current year for copyright notices
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * App version with build information
 */
export const getVersionInfo = (): string => {
  return `${APP_CONFIG.version} (Build ${getCurrentYear()}.${new Date().getMonth() + 1})`;
};

/**
 * Format currency according to locale and currency settings
 */
export const formatCurrency = (
  amount: number,
  currencyCode = APP_CONFIG.defaultCurrency
): string => {
  const currency = APP_CONFIG.currencies.find(c => c.code === currencyCode);

  if (!currency) {
    return `$${amount.toFixed(2)}`;
  }

  if (currencyCode === 'JPY') {
    return `${currency.symbol}${Math.round(amount)}`;
  }

  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Gets the current active API configuration based on environment
 */
export const getActiveApiConfig = () => {
  const env = APP_CONFIG.api.environment;
  return env === 'development' ? APP_CONFIG.api.development : APP_CONFIG.api.production;
};

/**
 * Platform capabilities object - used to check what features are available
 */
export const capabilities = {
  supportsChain: (chain: string): boolean => {
    return chain.toLowerCase() === 'solana';
  },

  getFeatureStatus: (featureName: keyof typeof APP_CONFIG.features): boolean => {
    return APP_CONFIG.features[featureName];
  },

  getSupportedCurrencies: () => {
    return APP_CONFIG.currencies;
  }
};

export default APP_CONFIG;
