
import { HeliusTokenData, HeliusTokenResponse } from '@/utils/heliusTypes';
import { Token, WalletActivity } from '@/types/token.types';
import {
  BIRDEYE_API_KEY
} from '@/utils/apiUtils';
import { secureApiService } from '@/services/secureApiService';

const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

// Test Helius API connection
export const testHeliusConnection = async (): Promise<boolean> => {
  return secureApiService.testHeliusConnection();
};

// Utility function to fetch token metadata from Helius API
export const fetchTokenMetadata = async (tokenAddress: string): Promise<HeliusTokenData | null> => {
  try {
    const response = await secureApiService.heliusApiCall('tokens/metadata', {
      mintAccounts: [tokenAddress],
    });

    const data = response;

    if (!data || !data.result || data.result.length === 0) {
      console.warn(`No metadata found for token: ${tokenAddress}`);
      return null;
    }

    const tokenData: HeliusTokenResponse = data.result[0];

    // Extract token data with fallbacks for different data structures
    const name =
      tokenData.result?.onChainData?.data?.name ||
      tokenData.result?.offChainData?.name ||
      tokenData.result?.legacyMetadata?.name ||
      tokenData.result?.tokenData?.name ||
      'Unknown Token';

    const symbol =
      tokenData.result?.onChainData?.data?.symbol ||
      tokenData.result?.offChainData?.symbol ||
      tokenData.result?.legacyMetadata?.symbol ||
      tokenData.result?.tokenData?.symbol ||
      tokenAddress.substring(0, 4);

    const decimals =
      tokenData.result?.onChainData?.data?.decimals ||
      tokenData.result?.offChainData?.decimals ||
      tokenData.result?.legacyMetadata?.decimals ||
      tokenData.result?.tokenData?.decimals ||
      9;

    const supply = tokenData.result?.supply || tokenData.result?.tokenData?.supply || 0;

    return {
      name,
      symbol,
      decimals,
      mintAddress: tokenAddress,
      supply,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
};

// Convert token info to Token type
export const tokenInfoToToken = (token: Token): Token => {
  return {
    ...token,
    // Ensure these fields exist with defaults if they don't
    price: token.price || 0,
    marketCap: token.marketCap || 0,
    volume24h: token.volume24h || 0,
    change24h: token.change24h || 0,
    holders: token.holders || 0,
    liquidity: token.liquidity || 0,
    supply: token.supply || 0,
    logoURI: token.logoURI || '',
    description: token.description || '',
    website: token.website || '',
    twitter: token.twitter || '',
    riskLevel: token.riskLevel || 50,
    qualityScore: token.qualityScore || 50,
  };
};

// Get token information from BirdEye API
export const getTokenInfo = async (tokenAddress: string): Promise<any> => {
  try {
    // First try BirdEye for price data
    const birdeyeUrl = `${BIRDEYE_API_BASE}/public/tokenInfo?address=${tokenAddress}`;
    const response = await fetch(birdeyeUrl, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token info from BirdEye');
    }

    const data = await response.json();

    if (data && data.data) {
      return data.data;
    }

    throw new Error('No token data returned from BirdEye');

  } catch (error) {
    console.error('Error fetching token info:', error);

    // Fall back to Helius metadata
    try {
      return await fetchTokenMetadata(tokenAddress);
    } catch (heliusError) {
      console.error('Fallback to Helius failed:', heliusError);
      return null;
    }
  }
};

// Get recent token activity
export const getRecentTokenActivity = async (): Promise<Token[]> => {
  try {
    // This would normally call an API - for now return mock data
    const mockTokens: Token[] = [
      {
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        name: 'Bonk',
        symbol: 'BONK',
        decimals: 5,
        price: 0.00000235,
        marketCap: 1540000000,
        volume24h: 25000000,
        change24h: 5.2,
        holders: 125000,
        liquidity: 15000000,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 85,
        trendingScore: 95
      },
      {
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        name: 'Samoyedcoin',
        symbol: 'SAMO',
        decimals: 9,
        price: 0.0125,
        marketCap: 56000000,
        volume24h: 1500000,
        change24h: -2.3,
        holders: 38000,
        liquidity: 3500000,
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 80,
        trendingScore: 85
      },
      {
        address: 'MEMEXQWzNMLG4t5UtUVqbXEhJSxssCwYVTT1dosXKz7',
        name: 'MEME100',
        symbol: 'MEME',
        decimals: 6,
        price: 0.0000078,
        marketCap: 350000,
        volume24h: 120000,
        change24h: 103.5,
        holders: 850,
        liquidity: 250000,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 60,
        trendingScore: 100,
        source: 'MEME1000X'
      }
    ];

    return mockTokens;
  } catch (error) {
    console.error('Error getting recent token activity:', error);
    return [];
  }
};

// Get trending tokens from various sources
export const getTrendingTokens = async (): Promise<Token[]> => {
  try {
    // This would normally call trending APIs - for now return mock data
    const mockTrending: Token[] = [
      {
        address: 'WIFoYQM7UpsMW67Py4NAfmLZgcMoreLhiM12tGMkXTP',
        name: 'WIF With Hat',
        symbol: 'WIF',
        decimals: 9,
        price: 0.058,
        marketCap: 284500000,
        volume24h: 7500000,
        change24h: 8.3,
        holders: 25800,
        liquidity: 12000000,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 95,
        trendingScore: 98
      },
      {
        address: 'jtojtomepa8beP8AuQc6eXt5FriJwfnGz1Y6law3uE',
        name: 'Jito',
        symbol: 'JTO',
        decimals: 9,
        price: 2.75,
        marketCap: 312000000,
        volume24h: 4500000,
        change24h: 1.5,
        holders: 15600,
        liquidity: 9000000,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 90,
        trendingScore: 92
      }
    ];

    return mockTrending;
  } catch (error) {
    console.error('Error getting trending tokens:', error);
    return [];
  }
};

// Get pump.fun tokens
export const getPumpFunTokens = async (): Promise<Token[]> => {
  try {
    // This would normally call pump.fun API - for now return mock data
    const mockPumpTokens: Token[] = [
      {
        address: 'daiskPLEbNUvVq1k8bCrdo7r9SuCDNYJyXnj1FJP8',
        name: 'Daisy',
        symbol: 'DAISY',
        decimals: 9,
        price: 0.000061,
        marketCap: 1850000,
        volume24h: 350000,
        change24h: 25.8,
        holders: 1950,
        liquidity: 450000,
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 75,
        trendingScore: 88,
        isPumpFun: true
      },
      {
        address: 'nofbptzYyFWCacYzLzTQ5dK1qPkQCVB1xKt6nyfxf5H',
        name: 'NOT FINANCIAL ADVICE',
        symbol: 'NFA',
        decimals: 9,
        price: 0.0000035,
        marketCap: 350000,
        volume24h: 95000,
        change24h: 43.2,
        holders: 568,
        liquidity: 120000,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        qualityScore: 60,
        trendingScore: 75,
        isPumpFun: true
      }
    ];

    return mockPumpTokens;
  } catch (error) {
    console.error('Error getting pump.fun tokens:', error);
    return [];
  }
};

// Track wallet activities (for smart money detection)
export const trackWalletActivities = async (walletAddresses: string[]): Promise<WalletActivity[]> => {
  try {
    // This would normally track wallets via API - for now return mock data
    const mockActivities: WalletActivity[] = [
      {
        id: "activity-1",
        walletAddress: walletAddresses[0] || "7KBVJktNTGjmUCCBzKR7n4XecQUzwuZ8VnLnkQnY8UeF",
        tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        tokenName: "Bonk",
        tokenSymbol: "BONK",
        amount: 155000000000,
        value: 365250,
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        activityType: 'buy',
        transactionHash: "4kT9XEd5PGVTr1XgkRnRYcYWt5gWLjJQmfFmrWEprBnXrk6K6F5FKtertrPdUGbzGrB5MiLaLnfi6UQNx4Cxcswp"
      },
      {
        id: "activity-2",
        walletAddress: walletAddresses[0] || "7KBVJktNTGjmUCCBzKR7n4XecQUzwuZ8VnLnkQnY8UeF",
        tokenAddress: "jtojtomepa8beP8AuQc6eXt5FriJwfnGz1Y6law3uE",
        tokenName: "Jito",
        tokenSymbol: "JTO",
        amount: 12500,
        value: 34375,
        timestamp: new Date(Date.now() - 85 * 60000).toISOString(),
        activityType: 'buy',
        transactionHash: "3B1NsUdMFnmJ4wnTeGQ7s9gQG6tkNSx6UYbsU6w9L89s5A3XGvJeuT7ymgKHWgJrw5WcCQBwvvgWJU9Gt9gbzbFT"
      }
    ];

    return mockActivities;
  } catch (error) {
    console.error('Error tracking wallet activities:', error);
    return [];
  }
};
