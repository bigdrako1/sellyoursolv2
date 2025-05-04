
import { TradingPositionData, HeliusTokenData, WalletActivity } from '@/types/database.types';
import { waitForRateLimit } from '@/utils/rateLimit';
import { APP_CONFIG } from '@/config/appDefinition';
import { getTokenPrice, getTokenPrices } from './jupiterService';

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
 * Interface for token metadata from external APIs
 */
export interface TokenInfo {
  metadata: {
    name: string;
    symbol: string;
    decimals: number;
    image?: string;
    address: string;
    verified?: boolean;
  };
  price: {
    current: number;
    change24h?: number;
    change1h?: number;
  };
  liquidity: {
    usd: number;
    sol?: number;
  };
  holders: {
    count: number;
    top?: Array<{address: string; amount: number; percentage: number}>;
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
    trendingScore: tokenInfo.isTrending ? ["trending"] : undefined,
    isPumpFun: tokenInfo.isPumpFunToken
  };
};

/**
 * Test Helius API connection
 * @returns Promise<boolean>
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const apiKey = localStorage.getItem('helius_api_key') || APP_CONFIG.api.defaultApiKey;
    if (!apiKey) return false;
    
    const endpoint = `https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`;
    const response = await fetch(`${endpoint}&tokenAddresses=["So11111111111111111111111111111111111111112"]`);
    
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
    
    const apiKey = localStorage.getItem('helius_api_key') || APP_CONFIG.api.defaultApiKey;
    if (!apiKey) {
      throw new Error("Helius API key not found");
    }
    
    const endpoint = `https://api.helius.xyz/v0/tokens/metadata?api-key=${apiKey}`;
    const response = await fetch(`${endpoint}&tokenAddresses=["${tokenAddress}"]`);
    
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
      },
      isPumpFunToken: isPumpFunToken(tokenAddress)
    };
    
    // Fetch price data from Jupiter API
    try {
      const price = await getTokenPrice(tokenAddress);
      if (price) {
        tokenInfo.price.current = price;
        
        // Calculate estimated market cap if we have supply info
        if (metadata.supply && metadata.supply.circulating) {
          const circulatingSupply = Number(metadata.supply.circulating) / Math.pow(10, metadata.decimals || 9);
          tokenInfo.marketCap = circulatingSupply * price;
        }
      }
    } catch (priceError) {
      console.error(`Error fetching price for ${tokenAddress}:`, priceError);
    }
    
    // Check if token is trending on Jupiter
    try {
      const response = await fetch('https://station.jup.ag/api/trending-tokens');
      if (response.ok) {
        const trendingData = await response.json();
        if (Array.isArray(trendingData)) {
          tokenInfo.isTrending = trendingData.some(token => token.address === tokenAddress);
        }
      }
    } catch (trendingError) {
      console.error(`Error checking trending status:`, trendingError);
    }
    
    // Calculate quality score based on available data
    let qualityScore = 50; // Default moderate quality
    
    // Pump.fun tokens generally have less history/auditing
    if (isPumpFunToken(tokenAddress)) {
      qualityScore -= 10;
    }
    
    // Verified tokens are more trustworthy
    if (tokenInfo.metadata.verified) {
      qualityScore += 20;
    }
    
    // Tokens with good liquidity are safer
    if (tokenInfo.liquidity.usd > 100000) {
      qualityScore += 15;
    } else if (tokenInfo.liquidity.usd > 50000) {
      qualityScore += 10;
    } else if (tokenInfo.liquidity.usd > 10000) {
      qualityScore += 5;
    }
    
    // Add quality score
    tokenInfo.quality = {
      score: Math.min(Math.max(qualityScore, 0), 100),
      label: getQualityLabel(qualityScore),
      risk: 100 - qualityScore
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
 * Get quality label based on score
 */
const getQualityLabel = (score: number): string => {
  if (score >= 80) return 'High Quality';
  if (score >= 60) return 'Good Quality';
  if (score >= 40) return 'Medium Quality';
  if (score >= 20) return 'Low Quality';
  return 'Poor Quality';
};

/**
 * Get recent token activity from the tracking system
 */
export const getRecentTokenActivity = async (): Promise<TokenInfo[]> => {
  try {
    await waitForRateLimit('heliusApi');
    
    // Fetch recently created tokens from Helius via mintlist API
    const apiKey = localStorage.getItem('helius_api_key') || APP_CONFIG.api.defaultApiKey;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const response = await fetch(`https://api.helius.xyz/v0/token-events?api-key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid token events data');
    }
    
    // Process token events into TokenInfo objects
    const tokens = await Promise.all(
      data.slice(0, 10).map(async (event) => {
        try {
          if (!event.tokenAddress) return null;
          
          return await getTokenInfo(event.tokenAddress);
        } catch {
          return null;
        }
      })
    );
    
    // Filter out nulls
    return tokens.filter(token => token !== null) as TokenInfo[];
  } catch (error) {
    console.error("Error fetching recent token activity:", error);
    return [];
  }
};

/**
 * Get trending tokens from various DEXes
 */
export const getTrendingTokens = async (): Promise<TokenInfo[]> => {
  try {
    await waitForRateLimit('jupiterApi');
    
    // Fetch trending from Jupiter
    const response = await fetch('https://station.jup.ag/api/trending-tokens');
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid trending tokens data');
    }
    
    // Process trending tokens into TokenInfo objects
    const tokens = await Promise.all(
      data.slice(0, 10).map(async (token) => {
        try {
          if (!token.address) return null;
          
          return await getTokenInfo(token.address);
        } catch {
          return null;
        }
      })
    );
    
    // Filter out nulls and mark as trending
    const validTokens = tokens.filter(token => token !== null) as TokenInfo[];
    
    // Mark all as trending
    validTokens.forEach(token => {
      token.isTrending = true;
    });
    
    return validTokens;
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
};

/**
 * Get tokens from the Pump.fun platform
 */
export const getPumpFunTokens = async (): Promise<TokenInfo[]> => {
  try {
    // Fetch trending from Pump.fun
    const response = await fetch('https://api.pump.fun/trending');
    
    if (!response.ok) {
      throw new Error(`Pump.fun API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.tokens)) {
      throw new Error('Invalid pump.fun tokens data');
    }
    
    // Process pump.fun tokens into TokenInfo objects
    const tokens = await Promise.all(
      data.tokens.slice(0, 10).map(async (token: any) => {
        try {
          if (!token.mint) return null;
          
          // Get token info
          const tokenInfo = await getTokenInfo(token.mint);
          
          // If we got token info, mark it as pump.fun
          if (tokenInfo) {
            tokenInfo.isPumpFunToken = true;
          }
          
          return tokenInfo;
        } catch {
          return null;
        }
      })
    );
    
    // Filter out nulls
    return tokens.filter(token => token !== null) as TokenInfo[];
  } catch (error) {
    console.error("Error fetching pump.fun tokens:", error);
    return [];
  }
};

/**
 * Track wallet activities for specified addresses
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<WalletActivity[]> => {
  try {
    await waitForRateLimit('heliusApi');
    
    if (walletAddresses.length === 0) return [];
    
    const apiKey = localStorage.getItem('helius_api_key') || APP_CONFIG.api.defaultApiKey;
    
    // Fetch recent transactions for each wallet
    const allActivities: WalletActivity[] = [];
    
    // Process each wallet
    for (const walletAddress of walletAddresses) {
      try {
        const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${apiKey}&limit=10`);
        
        if (!response.ok) {
          console.error(`Error fetching transactions for wallet ${walletAddress}: ${response.status}`);
          continue;
        }
        
        const transactions = await response.json();
        
        if (!Array.isArray(transactions)) {
          console.error(`Invalid transaction data for wallet ${walletAddress}`);
          continue;
        }
        
        // Process transactions to identify token activities
        for (const tx of transactions) {
          // Skip failed transactions
          if (!tx.successful) continue;
          
          // Check if this is a token transaction
          if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
            for (const transfer of tx.tokenTransfers) {
              // Get token data
              const tokenInfo = await getTokenInfo(transfer.mint);
              
              if (!tokenInfo) continue;
              
              // Determine activity type
              let activityType: 'buy' | 'sell' | 'send' | 'receive' | 'swap' | 'mint' | 'burn' | 'create' = 'swap';
              
              if (transfer.fromUserAccount === walletAddress && transfer.toUserAccount !== walletAddress) {
                activityType = 'sell';
              } else if (transfer.fromUserAccount !== walletAddress && transfer.toUserAccount === walletAddress) {
                activityType = 'buy';
              }
              
              // Calculate value in USD
              const value = (transfer.tokenAmount * (tokenInfo.price.current || 0));
              
              allActivities.push({
                id: tx.signature,
                walletAddress,
                tokenAddress: transfer.mint,
                tokenName: tokenInfo.metadata.name,
                tokenSymbol: tokenInfo.metadata.symbol,
                activityType,
                amount: transfer.tokenAmount,
                value,
                timestamp: tx.timestamp,
                transactionHash: tx.signature
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error processing wallet ${walletAddress}:`, error);
      }
    }
    
    // Sort by timestamp descending
    return allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
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
