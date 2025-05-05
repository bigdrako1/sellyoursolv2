
import { testHeliusConnection, HELIUS_API_KEY, HELIUS_RPC_URL, BIRDEYE_API_KEY, heliusRpcCall, heliusApiCall } from "../utils/apiUtils";
import { HeliusTokenData, HeliusTokenResponse } from "../utils/heliusTypes";
import { WalletActivity } from "@/types/token.types";
import { toast } from "@/hooks/use-toast";

// Re-export the testHeliusConnection function
export { testHeliusConnection };

// Re-export necessary functions and types from apiUtils
export { heliusRpcCall, heliusApiCall };

// Define token-related types
export interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  totalSupply?: string | number;
  description?: string;
  logoURI?: string;
  website?: string;
  twitter?: string;
  holders?: number;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  liquidity?: number;
  launchDate?: string;
  quality?: number;
  riskScore?: number;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  price?: number;
  priceChange24h?: number;
  marketCap?: number;
  liquidity?: number;
  volume24h?: number;
  holders?: number;
  launchDate?: string;
  quality?: number;
  riskScore?: number;
  isTrending?: boolean;
  trendingRank?: number;
  description?: string;
  website?: string;
  twitter?: string;
  decimals: number;
}

/**
 * Convert TokenInfo to Token
 */
export const tokenInfoToToken = (tokenInfo: TokenInfo): Token => {
  return {
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    address: tokenInfo.address,
    price: tokenInfo.price,
    priceChange24h: tokenInfo.priceChange24h,
    marketCap: tokenInfo.marketCap,
    liquidity: tokenInfo.liquidity,
    volume24h: tokenInfo.volume24h,
    holders: tokenInfo.holders,
    launchDate: tokenInfo.launchDate,
    quality: tokenInfo.quality,
    riskScore: tokenInfo.riskScore,
    decimals: tokenInfo.decimals,
    description: tokenInfo.description,
    website: tokenInfo.website,
    twitter: tokenInfo.twitter,
  };
};

/**
 * Get token information
 */
export const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo | null> => {
  try {
    // First try to get token info from Helius
    const tokenMetadata = await fetchTokenMetadata(tokenAddress);
    
    if (!tokenMetadata?.name) {
      console.warn(`Failed to fetch token metadata from Helius for ${tokenAddress}`);
      return null;
    }
    
    // Get price and market data from Birdeye
    const marketData = await fetchTokenMarketData(tokenAddress);
    
    return {
      name: tokenMetadata.name || "Unknown Token",
      symbol: tokenMetadata.symbol || tokenAddress.substring(0, 4),
      address: tokenAddress,
      decimals: tokenMetadata.decimals || 0,
      totalSupply: tokenMetadata.supply,
      description: tokenMetadata.description,
      logoURI: tokenMetadata.logoURI,
      website: tokenMetadata.website,
      twitter: tokenMetadata.twitter,
      price: marketData?.price,
      marketCap: marketData?.marketCap,
      volume24h: marketData?.volume24h,
      priceChange24h: marketData?.priceChange24h,
      liquidity: marketData?.liquidity,
      holders: marketData?.holders,
      quality: calculateTokenQuality(marketData),
      riskScore: calculateRiskScore(marketData, tokenMetadata),
    };
  } catch (error) {
    console.error(`Error fetching token info for ${tokenAddress}:`, error);
    toast({
      title: "Error retrieving token data",
      description: `Failed to fetch token information for ${tokenAddress}`,
      variant: "destructive",
    });
    return null;
  }
};

/**
 * Fetch token metadata from Helius
 */
export const fetchTokenMetadata = async (tokenAddress: string): Promise<HeliusTokenData> => {
  try {
    const url = `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [tokenAddress] }),
    });
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const tokenData = data[0] as HeliusTokenResponse;
    
    // Extract token metadata
    let name, symbol, decimals, supply;
    
    // Try to get values from different parts of the response
    if (tokenData.result) {
      // Try onChainData
      if (tokenData.result.onChainData?.data) {
        name = tokenData.result.onChainData.data.name;
        symbol = tokenData.result.onChainData.data.symbol;
      }
      
      // Try offChainData
      if (!name && tokenData.result.offChainData) {
        name = tokenData.result.offChainData.name;
        symbol = tokenData.result.offChainData.symbol;
      }
      
      // Try legacyMetadata
      if (!name && tokenData.result.legacyMetadata) {
        name = tokenData.result.legacyMetadata.name;
        symbol = tokenData.result.legacyMetadata.symbol;
      }
      
      // Try tokenData
      if (!name && tokenData.result.tokenData) {
        name = tokenData.result.tokenData.name;
        symbol = tokenData.result.tokenData.symbol;
        supply = tokenData.result.tokenData.supply;
      }
      
      // Get supply if not already set
      if (!supply && tokenData.result.supply) {
        supply = tokenData.result.supply;
      }
    }
    
    return {
      name: name || "Unknown Token",
      symbol: symbol || tokenAddress.substring(0, 4),
      decimals: decimals || 9,
      supply: supply || 0,
      mintAddress: tokenAddress,
    };
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenAddress}:`, error);
    return {
      name: "Unknown Token",
      symbol: tokenAddress.substring(0, 4),
      decimals: 9,
      mintAddress: tokenAddress,
    };
  }
};

/**
 * Fetch token market data from Birdeye
 */
const fetchTokenMarketData = async (tokenAddress: string): Promise<{
  price?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  liquidity?: number;
  holders?: number;
}> => {
  try {
    const url = `${BIRDEYE_API_BASE}/public/tokenInfo?address=${tokenAddress}`;
    const response = await fetch(url, {
      headers: {
        'x-api-key': BIRDEYE_API_KEY,
      }
    });
    
    if (!response.ok) {
      throw new Error(`Birdeye API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      price: data.data?.price,
      marketCap: data.data?.mc,
      volume24h: data.data?.v24h,
      priceChange24h: data.data?.priceChange24h,
      liquidity: data.data?.liquidity,
      holders: data.data?.holderCount,
    };
  } catch (error) {
    console.error(`Error fetching market data for ${tokenAddress}:`, error);
    return {};
  }
};

/**
 * Calculate token quality score
 */
const calculateTokenQuality = (marketData: any): number => {
  if (!marketData) return 0;
  
  let score = 0;
  
  // Liquidity factor (0-20 points)
  const liquidity = marketData.liquidity || 0;
  if (liquidity >= 1000000) score += 20;
  else if (liquidity >= 500000) score += 15;
  else if (liquidity >= 100000) score += 10;
  else if (liquidity >= 50000) score += 5;
  else if (liquidity < 25000) score -= 10;
  
  // Holders factor (0-15 points)
  const holders = marketData.holders || 0;
  if (holders >= 1000) score += 15;
  else if (holders >= 500) score += 10;
  else if (holders >= 100) score += 5;
  else if (holders < 25) score -= 10;
  
  // Volume factor (0-15 points)
  const volume24h = marketData.volume24h || 0;
  if (volume24h >= 500000) score += 15;
  else if (volume24h >= 100000) score += 10;
  else if (volume24h >= 50000) score += 5;
  else if (volume24h < 10000) score -= 5;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate risk score
 */
const calculateRiskScore = (marketData: any, tokenMetadata: any): number => {
  if (!marketData) return 100;
  
  let riskScore = 50;
  
  // Liquidity factor
  const liquidity = marketData.liquidity || 0;
  if (liquidity >= 1000000) riskScore -= 20;
  else if (liquidity >= 100000) riskScore -= 10;
  else if (liquidity < 10000) riskScore += 20;
  
  // Holders factor
  const holders = marketData.holders || 0;
  if (holders >= 1000) riskScore -= 10;
  else if (holders < 50) riskScore += 15;
  
  return Math.max(0, Math.min(100, riskScore));
};

/**
 * Get recent token activity
 */
export const getRecentTokenActivity = async (): Promise<Token[]> => {
  try {
    // This would normally fetch from an API
    // Mocked implementation for now
    return [
      {
        name: "Example Token",
        symbol: "EX",
        address: "ExampleAddressForAToken11111111111111111111",
        price: 0.00032,
        priceChange24h: 5.2,
        marketCap: 320000,
        liquidity: 50000,
        volume24h: 25000,
        holders: 120,
        decimals: 9,
      }
    ];
  } catch (error) {
    console.error("Error fetching recent token activity:", error);
    return [];
  }
};

/**
 * Get trending tokens
 */
export const getTrendingTokens = async (): Promise<Token[]> => {
  try {
    // This would normally fetch from an API
    // Mocked implementation for now
    return [
      {
        name: "Trending Token",
        symbol: "TREND",
        address: "TrendingAddressForAToken111111111111111111",
        price: 0.00045,
        priceChange24h: 12.7,
        marketCap: 450000,
        liquidity: 75000,
        volume24h: 45000,
        holders: 230,
        isTrending: true,
        trendingRank: 1,
        decimals: 9,
      }
    ];
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
};

/**
 * Get pump.fun tokens
 */
export const getPumpFunTokens = async (): Promise<Token[]> => {
  try {
    // This would fetch from pump.fun API
    // Mocked implementation for now
    return [
      {
        name: "Pump Token",
        symbol: "PUMP",
        address: "PumpFunTokenAddressForAToken1111111111111",
        price: 0.00012,
        priceChange24h: 25.3,
        marketCap: 150000,
        liquidity: 35000,
        volume24h: 28000,
        holders: 180,
        decimals: 9,
      }
    ];
  } catch (error) {
    console.error("Error fetching pump.fun tokens:", error);
    return [];
  }
};

/**
 * Track wallet activities
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<WalletActivity[]> => {
  try {
    // This would normally fetch from Helius API
    // Mocked implementation for now
    return [
      {
        id: "activity1",
        walletAddress: walletAddresses[0] || "WalletAddress111111111111111111111111111",
        tokenAddress: "TokenAddress11111111111111111111111111111",
        tokenName: "Smart Money Token",
        tokenSymbol: "SMT",
        amount: 10000,
        value: 5000,
        timestamp: new Date().toISOString(),
        transactionHash: "transaction111111111111111111",
        activityType: "buy"
      },
      {
        id: "activity2",
        walletAddress: walletAddresses[0] || "WalletAddress111111111111111111111111111",
        tokenAddress: "TokenAddress22222222222222222222222222222",
        tokenName: "Another Token",
        tokenSymbol: "AT",
        amount: 5000,
        value: 2500,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        transactionHash: "transaction222222222222222222",
        activityType: "sell"
      }
    ];
  } catch (error) {
    console.error("Error tracking wallet activities:", error);
    return [];
  }
};
