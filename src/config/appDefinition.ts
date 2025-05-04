
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
    baseUrl: "https://api.helius.xyz/v1",
    rpcUrl: "https://mainnet.helius-rpc.com",
    wsUrl: "wss://mainnet.helius-rpc.com",
    defaultApiKey: "a18d2c93-d9fa-4db2-8419-707a4f1782f7"
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
