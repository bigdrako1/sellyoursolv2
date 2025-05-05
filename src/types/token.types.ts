
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  decimals: number;
  supply: string;
  coingeckoId: string | null;
  lastUpdatedAt: number | null;
  description: string | null;
  twitter: string | null;
  website: string | null;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
  price: number;
  marketCap: number;
  change24h?: number;
  volume24h?: number;
  liquidity?: number;
  holders?: number;
  qualityScore: number;
  createdAt: Date;
  source: string;
  isPumpFun?: boolean;
  trendingScore?: number | string[];
  riskLevel?: number;
}

export interface WalletActivity {
  id: string;
  walletAddress: string;
  tokenAddress?: string;
  tokenName: string;
  tokenSymbol: string;
  activityType: 'buy' | 'sell' | 'transfer' | 'other';
  amount?: number;
  value?: number;
  timestamp: string;
  transactionHash: string;
}
