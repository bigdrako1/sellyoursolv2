import { TradingPositionData, HeliusTokenData, TokenInfo, SmartMoneyAlert, WalletActivity } from '@/types/database.types';
import { waitForRateLimit } from '@/utils/rateLimit';

// Cache for token data to reduce API calls
const tokenDataCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_EXPIRY = 900000; // 15 minutes

/**
 * Check if a token is a Pump.fun token based on its address
 */
export const isPumpFunToken = (tokenAddress: string): boolean => {
  // Check if token address ends with 'pump' or 'boop'
  return tokenAddress.toLowerCase().endsWith('pump') || 
         tokenAddress.toLowerCase().endsWith('boop');
};

/**
 * Convert TokenInfo to a simplified Token interface for UI
 */
export interface Token {
  name: string;
  symbol: string;
  address: string;
  price: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  qualityScore: number;
  source: string;
  createdAt: Date;
  change24h?: number;
  trendingScore?: string[];
  trendingSources?: string[];
  isPumpFun?: boolean;
}

// Export TokenInfo interface from database.types.ts
export { TokenInfo };

/**
 * Helper function to convert TokenInfo to Token interface
 */
export const tokenInfoToToken = (tokenInfo: TokenInfo): Token => {
  return {
    name: tokenInfo.metadata.name,
    symbol: tokenInfo.metadata.symbol,
    address: tokenInfo.metadata.address,
    price: tokenInfo.price.current || 0,
    marketCap: tokenInfo.marketCap || 0,
    liquidity: tokenInfo.liquidity.usd || 0,
    holders: tokenInfo.holders.count || 0,
    qualityScore: tokenInfo.quality?.score || 50,
    source: tokenInfo.isPumpFunToken ? "Pump.fun" : "DEX",
    createdAt: tokenInfo.created ? new Date(tokenInfo.created) : new Date(),
    change24h: tokenInfo.price.change24h,
    trendingScore: tokenInfo.isTrending ? 3 : undefined,
    isPumpFun: tokenInfo.isPumpFunToken
  };
};

/**
 * Test Helius API connection
 * @returns Promise<boolean>
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const apiKey = localStorage.getItem('helius_api_key');
    if (!apiKey) return false;
    
    const endpoint = `https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`;
    const response = await fetch(`${endpoint}&tokenAddresses=${["So11111111111111111111111111111111111111112"]}`);
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) && data.length > 0;
  } catch (error) {
    console.error("Failed to test Helius connection:", error);
    return false;
  }
};

/**
 * Fetch token metadata from Helius API
 * @param tokenAddress - Solana token address
 */
export const fetchTokenMetadata = async (tokenAddress: string): Promise<HeliusTokenData | null> => {
  try {
    // Check cache first
    const cacheKey = `token_metadata_${tokenAddress}`;
    const cachedData = tokenDataCache[cacheKey];
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
      return cachedData.data;
    }
    
    // Rate limit API calls
    await waitForRateLimit('heliusApi');
    
    const apiKey = localStorage.getItem('helius_api_key');
    if (!apiKey) {
      throw new Error("Helius API key not found");
    }
    
    const endpoint = `https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`;
    const response = await fetch(`${endpoint}&tokenAddresses=${[tokenAddress]}`);
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      // Store in cache
      tokenDataCache[cacheKey] = {
        data: data[0],
        timestamp: Date.now()
      };
      
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Get comprehensive token data including price, liquidity, etc.
 * @param tokenAddress - Solana token address
 */
export const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo | null> => {
  try {
    // Check cache first
    const cacheKey = `token_info_${tokenAddress}`;
    const cachedData = tokenDataCache[cacheKey];
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
      return cachedData.data;
    }
    
    // Fetch basic metadata first
    const metadata = await fetchTokenMetadata(tokenAddress);
    
    if (!metadata) {
      return null;
    }
    
    // Create basic token info
    const tokenInfo: TokenInfo = {
      metadata: {
        name: metadata.name || 'Unknown Token',
        symbol: metadata.symbol || 'UNKNOWN',
        decimals: metadata.decimals || 9,
        address: tokenAddress,
        image: metadata.offChainData?.image,
        verified: false
      },
      price: {
        current: 0,
      },
      liquidity: {
        usd: 0
      },
      holders: {
        count: 0
      }
    };
    
    // Store in cache
    tokenDataCache[cacheKey] = {
      data: tokenInfo,
      timestamp: Date.now()
    };
    
    return tokenInfo;
  } catch (error) {
    console.error(`Error getting token info for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Get recent token activity from the tracking system
 */
export const getRecentTokenActivity = async (): Promise<TokenInfo[]> => {
  // This would typically fetch from a backend API or local storage
  // For now, return a mock empty array
  return [];
};

/**
 * Get trending tokens from various DEXes
 */
export const getTrendingTokens = async (): Promise<TokenInfo[]> => {
  // This would fetch trending tokens from various DEXes
  // For now, return a mock empty array
  return [];
};

/**
 * Get tokens from the Pump.fun platform
 */
export const getPumpFunTokens = async (): Promise<TokenInfo[]> => {
  // This would typically fetch from Pump.fun's API
  // For now, return a mock empty array
  return [];
};

/**
 * Track wallet activities for specified addresses
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<WalletActivity[]> => {
  // For demonstration purposes, return mock data that includes buy/sell activities
  try {
    await waitForRateLimit('heliusApi');
    
    // This would typically fetch real data from an API
    if (walletAddresses.length === 0) return [];
    
    return [
      {
        id: '1',
        walletAddress: walletAddresses[0],
        tokenAddress: 'So11111111111111111111111111111111111111112',
        tokenName: 'Solana',
        tokenSymbol: 'SOL',
        activityType: 'buy',
        amount: 5.2,
        value: 720,
        timestamp: new Date().toISOString(),
        transactionHash: '4ETf86tK5DZ5MnJFUQRTmhSQ9pD6bXEWQe8hEycdYc9ZtG9hrZ7GJkiL1QvJ9DNLZDSKbKMkxJCwTfLTZ9kgfFMt'
      },
      {
        id: '2',
        walletAddress: walletAddresses[0],
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenName: 'USD Coin',
        tokenSymbol: 'USDC',
        activityType: 'sell',
        amount: 1000,
        value: 1000,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        transactionHash: '5hbxDr8iqxrZi7pPWh4kKNzwAjXnLShxPzZHqQwKKM3aLYxTgxNgJ3H4Pj9ydJnNEmdUZLKd1rCmvYXAQ6bhAf9q'
      }
    ];
  } catch (error) {
    console.error("Error tracking wallet activities:", error);
    return [];
  }
};

/**
 * Local functions to load and save trading positions
 */
export const loadTradingPositions = (): TradingPositionData[] => {
  try {
    const saved = localStorage.getItem('tradingPositions');
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error) {
    console.error("Error loading trading positions:", error);
    return [];
  }
};

export const saveTradingPosition = (position: TradingPositionData): void => {
  try {
    const positions = loadTradingPositions();
    const existingIndex = positions.findIndex(p => p.contract_address === position.contract_address);
    
    if (existingIndex >= 0) {
      positions[existingIndex] = position;
    } else {
      positions.push(position);
    }
    
    localStorage.setItem('tradingPositions', JSON.stringify(positions));
  } catch (error) {
    console.error("Error saving trading position:", error);
  }
};

/**
 * Clean up expired cache entries
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  Object.keys(tokenDataCache).forEach(key => {
    if (now - tokenDataCache[key].timestamp > CACHE_EXPIRY) {
      delete tokenDataCache[key];
    }
  });
};

// Periodically clean up the cache
setInterval(cleanupCache, CACHE_EXPIRY);
