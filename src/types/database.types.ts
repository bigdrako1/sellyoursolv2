
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

export interface TradingPositionData {
  contract_address: string;
  entry_price: number;
  entry_time: string;
  initial_investment: number;
  current_amount: number;
  current_price: number;
  last_update_time: string;
  secured_initial: boolean;
  scale_out_history: Array<{
    amount: number;
    price: number;
    timestamp: string;
    reason: string;
  }>;
  source: string;
  status: 'active' | 'closed' | 'failed';
  pnl: number;
  roi: number;
  notes: string;
  token_name: string;
  token_symbol: string;
}
