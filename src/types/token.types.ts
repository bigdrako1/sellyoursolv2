
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
  createdAt?: string;
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
