
// Token-related types

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  holders?: number;
  liquidity?: number;
  supply?: number | string;
  logoURI?: string;
  description?: string;
  website?: string;
  twitter?: string;
  riskLevel?: number;
  qualityScore?: number;
  trendingScore?: number | string[];
  isPumpFun?: boolean;
  createdAt?: string | Date;
  source?: string;
  lastUpdated?: string;
  socialScore?: number; // KOL mentions count
  smartMoneyScore?: number; // Smart money wallet buys count
  runnerPotential?: string; // Very Low to Very High
}

export interface TokenPriceInfo {
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export interface TokenPosition {
  address: string;
  entryPrice: number;
  currentPrice?: number;
  amount: number;
  timestamp: string;
  name: string;
  symbol: string;
}

export interface TokenAlert {
  address: string;
  name: string;
  symbol: string;
  type: 'price' | 'volume' | 'trend' | 'new' | 'smartmoney' | 'social';
  timestamp: string;
  message: string;
  qualityScore?: number;
  source?: string;
}

export interface WalletActivity {
  id: string;
  walletAddress: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  amount?: number;
  value?: number;
  timestamp: string;
  activityType: 'buy' | 'sell' | 'transfer';
  transactionHash: string;
}

export interface TelegramSource {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isConnected: boolean;
  lastChecked?: string;
  tokenCount?: number;
}

export interface TwitterSource {
  id: string;
  handle: string;
  name?: string;
  isActive: boolean;
  lastChecked?: string;
  tokenCount?: number;
}
