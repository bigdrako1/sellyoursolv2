
export interface HeliusTokenData {
  symbol?: string;
  name?: string;
  decimals?: number;
  tokenAuthority?: string;
  supply?: string | number;  
  mintAddress?: string;
  logoURI?: string;
  eTag?: string;
  totalSupply?: string;
  description?: string;
  twitter?: string;
  website?: string;
  extensions?: {
    coingeckoId?: string;
  };
  lastUpdatedAt?: number;
}

export interface HeliusTokenResponse {
  result?: {
    onChainData?: {
      data?: {
        name?: string;
        symbol?: string;
        uri?: string;
        sellerFeeBasisPoints?: number;
        creators?: Array<{
          address: string;
          verified: boolean;
          share: number;
        }>;
      };
      updateAuthority?: string;
      mint?: string;
      primarySaleHappened?: boolean;
      sellerFeeBasisPoints?: number;
      tokenStandard?: string;
      supply?: string | number;
    };
    offChainData?: {
      name?: string;
      symbol?: string;
      description?: string;
      image?: string;
      animation_url?: string;
      external_url?: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
      properties?: {
        files?: Array<{
          uri: string;
          type: string;
          cdn?: boolean;
        }>;
        category?: string;
      };
      collection?: {
        name?: string;
        family?: string;
      };
    };
    legacyMetadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      image?: string;
    };
    supply?: string | number;
    tokenData?: {
      name?: string;
      symbol?: string;
      supply?: string | number;
    };
  };
}

export interface HeliusWalletBalance {
  address: string;
  balance: number;
  nativeBalance?: number;
  tokens: {
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
    symbol?: string;
    logo?: string;
  }[];
}

export function parseHeliusWalletBalance(data: any): HeliusWalletBalance {
  return {
    address: data.address || "",
    balance: parseFloat(data.lamports || 0) / 1e9,
    nativeBalance: parseFloat(data.lamports || 0) / 1e9,
    tokens: Array.isArray(data.tokens) 
      ? data.tokens.map((token: any) => ({
          mint: token.mint || "",
          amount: parseFloat(token.amount || 0) / Math.pow(10, token.decimals || 0),
          decimals: token.decimals || 0,
          tokenAccount: token.tokenAccount || "",
          symbol: token.symbol || token.mint?.substring(0, 4) || "",
          logo: token.logo || ""
        }))
      : []
  };
}

// Export all types from this file for service usage
export type { HeliusTokenData as TokenData, HeliusTokenResponse as TokenResponse };
