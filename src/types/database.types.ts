
import { Currency } from "@/store/currencyStore";

export interface Profile {
  id: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  name: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  transaction_type: string;
  token_symbol: string;
  amount: number;
  price_at_transaction: number | null;
  timestamp: string;
  status: string;
  transaction_hash: string | null;
  notes: string | null;
}

export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  auto_trade_enabled: boolean;
  risk_level: number;
  dark_mode: boolean;
  system_active: boolean;
  system_latency: number;
  api_key: string | null;
  helius_api_key: string | null;
}

export interface ScaleOutHistory {
  amount: number;
  price: number;
  timestamp: string;
  reason: string;
}

export interface TradingPositionData {
  contract_address: string;
  entry_price: number;
  entry_time: string;
  initial_investment: number;
  current_amount: number;
  current_price: number;
  last_update_time: string;
  secured_initial: boolean;
  scale_out_history: ScaleOutHistory[];
  source: string;
  status: 'active' | 'closed' | 'failed';
  pnl: number;
  roi: number;
  notes: string;
  token_name: string;
  token_symbol: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  image?: string;
  address: string;
  verified?: boolean;
}

export interface TokenPrice {
  current: number;
  change24h?: number;
  change1h?: number;
}

export interface TokenLiquidity {
  usd: number;
  sol?: number;
}

export interface TokenHolder {
  address: string;
  amount: number;
  percentage: number;
}

export interface TokenInfo {
  metadata: TokenMetadata;
  price: TokenPrice;
  liquidity: TokenLiquidity;
  holders: {
    count: number;
    top?: TokenHolder[];
  };
  volume24h?: number;
  marketCap?: number;
  created?: string;
  isVerified?: boolean;
  isTrending?: boolean;
  isPumpFunToken?: boolean;
  quality?: {
    score: number;
    label: string;
    risk: number;
  };
}

export interface SmartMoneyAlert {
  id: string;
  walletAddress: string;
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  amount: number;
  value: number;
  timestamp: string;
  transactionHash: string;
  type: 'buy' | 'sell';
}

export interface HeliusTokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  onChainData?: {
    mint: string;
    name?: string;
    symbol?: string;
    decimals?: number;
  };
  offChainData?: {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    externalUrl?: string;
  };
}

export interface WalletActivity {
  id: string;
  walletAddress: string;
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  activityType: 'send' | 'receive' | 'swap' | 'mint' | 'burn' | 'create';
  amount?: number;
  value?: number;
  timestamp: string;
  transactionHash: string;
  counterparty?: string;
}

export interface TelegramChannel {
  id: string;
  name: string;
  channelId: string;
  enabled: boolean;
  lastChecked: string;
  messageCount: number;
}

export interface TokenAlert {
  id: string;
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  price: number;
  marketCap?: number;
  liquidity: number;
  holdersCount: number;
  qualityScore: number;
  riskLevel: string;
  source: string;
  timestamp: string;
  isSmartMoneyBuy?: boolean;
  isPumpFunToken?: boolean;
  isTrending?: boolean;
}
