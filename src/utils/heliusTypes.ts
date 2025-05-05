
export interface HeliusTokenData {
  symbol?: string;
  name?: string;
  decimals?: number;
  tokenAuthority?: string;
  supply?: string | number;  // Adding the missing supply property
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
