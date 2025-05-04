
export interface HeliusWalletBalance {
  nativeBalance?: number;
  tokens?: TokenBalance[];
}

export interface TokenBalance {
  mint?: string;
  amount?: number;
  decimals?: number;
  symbol?: string;
  logo?: string;
}

/**
 * Type guard to check if an object is a HeliusWalletBalance
 */
export function isHeliusWalletBalance(obj: unknown): obj is HeliusWalletBalance {
  return (
    typeof obj === 'object' && 
    obj !== null &&
    (
      'nativeBalance' in obj ||
      'tokens' in obj
    )
  );
}

/**
 * Parse and validate Helius API response for wallet balances
 */
export function parseHeliusWalletBalance(data: unknown): HeliusWalletBalance | null {
  if (!isHeliusWalletBalance(data)) {
    return null;
  }
  
  return data;
}
