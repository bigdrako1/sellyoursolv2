
// Helius API related types

export interface HeliusTokenData {
  name: string;
  symbol: string;
  decimals: number;
  mintAddress: string;
  supply?: number | string;
  description?: string;
  logoURI?: string;
  website?: string;
  twitter?: string;
}

export interface HeliusTokenResponse {
  result?: {
    onChainData?: {
      data?: {
        name: string;
        symbol: string;
        decimals: number;
      };
    };
    offChainData?: {
      name: string;
      symbol: string;
      decimals: number;
    };
    legacyMetadata?: {
      name: string;
      symbol: string;
      decimals: number;
    };
    tokenData?: {
      name: string;
      symbol: string;
      decimals: number;
      supply: number | string;
    };
    supply?: number | string;
  };
}

export interface HeliusTransaction {
  signature: string;
  type: string;
  timestamp: number;
  slot: number;
  fee: number;
  status: 'success' | 'failed';
  events?: any[];
  signer?: string[];
  tokenTransfers?: HeliusTokenTransfer[];
  nativeTransfers?: HeliusNativeTransfer[];
}

export interface HeliusTokenTransfer {
  fromTokenAccount?: string;
  toTokenAccount?: string;
  fromUserAccount?: string;
  toUserAccount?: string;
  tokenAmount?: number;
  mint?: string;
}

export interface HeliusNativeTransfer {
  fromUserAccount?: string;
  toUserAccount?: string;
  amount?: number;
}

export interface HeliusWebhookPayload {
  webhook_id: string;
  webhook_name: string;
  data: HeliusTransaction[];
}
