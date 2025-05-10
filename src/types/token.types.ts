
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
  type: 'price' | 'volume' | 'trend' | 'new';
  timestamp: string;
  message: string;
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

/**
 * Scale out event interface
 */
export interface ScaleOutEvent {
  time: string;
  price: number;
  amount: number;
  tokens: number;
  reason: string;
  percentOfPosition: number;
}

/**
 * Trading position interface
 */
export interface TradingPosition {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  entryTime: string;
  initialInvestment: number;
  currentAmount: number;
  currentPrice: number;
  lastUpdateTime: string;
  securedInitial: boolean;
  scaleOutHistory: ScaleOutEvent[];
  source: string;
  status: 'active' | 'closed' | 'failed';
  pnl: number;
  roi: number;
  notes: string;
}
