
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

export interface HeliusWalletBalance {
  address: string;
  lamports: number;
  solBalance: number;
  nativeBalance?: number; // Added for compatibility
  tokens: HeliusTokenBalance[];
}

export interface HeliusTokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
  tokenName?: string;
  tokenSymbol?: string;
  uiAmount?: number;
  symbol?: string;
  logo?: string;
}

// Helper function to parse wallet balances from Helius
export const parseHeliusWalletBalance = (data: any): HeliusWalletBalance => {
  if (!data) {
    return {
      address: '',
      lamports: 0,
      solBalance: 0,
      nativeBalance: 0, // Added for compatibility
      tokens: []
    };
  }

  // Parse SOL balance
  const lamports = data.lamports || 0;
  const solBalance = lamports / 1000000000; // Convert lamports to SOL

  // Parse token balances
  const tokens = (data.tokens || []).map((token: any) => {
    const decimals = token.tokenMetadata?.decimals || 9;
    const uiAmount = token.amount / Math.pow(10, decimals);
    
    return {
      mint: token.mint || '',
      amount: token.amount || 0,
      decimals: decimals,
      tokenAccount: token.tokenAccount || '',
      tokenName: token.tokenMetadata?.name || 'Unknown Token',
      tokenSymbol: token.tokenMetadata?.symbol || token.mint?.substring(0, 4) || 'UNKN',
      uiAmount: uiAmount,
      symbol: token.tokenMetadata?.symbol || token.mint?.substring(0, 4) || 'UNKN',
      logo: token.tokenMetadata?.logoURI || ''
    };
  });

  return {
    address: data.address || '',
    lamports,
    solBalance,
    nativeBalance: solBalance, // Added for compatibility
    tokens
  };
};
