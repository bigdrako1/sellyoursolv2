
// Token related types
export interface TokenData {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  holders?: number;
  liquidity?: number;
  quality?: number;
  risk?: number;
  logoURI?: string;
}

export interface WalletActivity {
  id: string;
  walletAddress: string;
  tokenAddress?: string;
  tokenName: string;
  tokenSymbol: string;
  amount?: number;
  value?: number;
  timestamp: string;
  transactionHash: string;
  activityType: 'buy' | 'sell' | 'transfer' | 'stake' | 'unstake' | 'swap';
  status?: 'completed' | 'pending' | 'failed';
}

export interface TokenAlert {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price?: number;
  priceChange?: number;
  marketCap?: number;
  liquidity?: number;
  volume?: number;
  alertType: 'new' | 'trending' | 'whale' | 'price' | 'volume';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  message: string;
  status: 'new' | 'read' | 'dismissed';
}
