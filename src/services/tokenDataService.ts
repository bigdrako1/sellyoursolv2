import { TokenInfo, Token, WalletActivity } from "@/types/token.types";
import { HeliusTokenData } from "@/utils/heliusTypes";
import { heliusApiCall, heliusRpcCall } from "@/utils/apiUtils";

// API base URLs
const HELIUS_API_URL = 'https://api.helius.xyz/v0';
const BIRDEYE_API_URL = 'https://public-api.birdeye.so/public';
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
const PUMPFUN_API_URL = 'https://api.pump.fun';
const JUPITER_API_URL = 'https://price.jup.ag/v4';

// Export the interfaces for use in other components
export { TokenInfo, Token }; // Export these types from token.types.ts

// Mock data for testing
const MOCK_TOKEN_DATA: Token[] = [
  {
    address: "BYJTQFqaZpuhCzM2KZU6NnBk3pkwrqVWpNZfaK7wVXf",
    name: "JupiterX",
    symbol: "JUPX",
    logoURI: "https://arweave.net/J5CZ1vS5G0BjAY3aBbTgF-72m1uziKainRfTOZOFLMM",
    price: 0.00012345,
    marketCap: 12500000,
    change24h: 15.23,
    volume24h: 345000,
    liquidity: 980000,
    holders: 1200,
    qualityScore: 82,
    createdAt: new Date(Date.now() - 86400000),
    source: "Smart Money Alert",
    isPumpFun: false,
    trendingScore: 3,
  },
  {
    address: "SBaHYPxCTiVrDYP971DTBJ6thanZaDvSMsw6dd7LrCT",
    name: "Bonky",
    symbol: "BONKY",
    logoURI: "https://arweave.net/OgBpN-9S_ouM-9q0R9d_of12D_RNTG6qrCuhWiL5QZQ",
    price: 0.00000234,
    marketCap: 4500000,
    change24h: -2.45,
    volume24h: 78000,
    liquidity: 230000,
    holders: 4500,
    qualityScore: 76,
    createdAt: new Date(Date.now() - 5400000),
    source: "Solana Activity Tracker",
    isPumpFun: true,
    trendingScore: 2,
  },
  {
    address: "DFXyG7CSHwJmfWCawsabNR2d8yy3NjHqPj31xLJGS9Qj",
    name: "SquidMoon",
    symbol: "SQUID",
    logoURI: "https://arweave.net/8GhQYvoFj3zWumpcuAqSi6NWG7Cw_LHN2A1p7gcmPf0",
    price: 0.0034567,
    marketCap: 1800000,
    change24h: 142.34,
    volume24h: 890000,
    liquidity: 340000,
    holders: 780,
    qualityScore: 65,
    createdAt: new Date(),
    source: "Whale Buy Bot",
    isPumpFun: false,
    trendingScore: 1,
  }
];

const MOCK_WALLET_ACTIVITIES: WalletActivity[] = [
  {
    id: '1',
    walletAddress: '3FQeKjoLJHnNBXcoVpjbsC6rqVS3JW7v2uNRyJWGzRup',
    tokenAddress: 'BYJTQFqaZpuhCzM2KZU6NnBk3pkwrqVWpNZfaK7wVXf',
    tokenName: 'JupiterX',
    tokenSymbol: 'JUPX',
    activityType: 'buy',
    amount: 120000,
    value: 15000,
    timestamp: new Date().toISOString(),
    transactionHash: '38vnxURKU8mPBHm6JA3vxXyPzS8knGcAJLoEjJ59hC9eCM2EYwe65ARbrLQiVDe1ygFVsUwm8qhHPBS6oVj9rZ3E',
  },
  {
    id: '2',
    walletAddress: '3FQeKjoLJHnNBXcoVpjbsC6rqVS3JW7v2uNRyJWGzRup',
    tokenAddress: 'SBaHYPxCTiVrDYP971DTBJ6thanZaDvSMsw6dd7LrCT',
    tokenName: 'Bonky',
    tokenSymbol: 'BONKY',
    activityType: 'sell',
    amount: 5000000,
    value: 8500,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    transactionHash: '3PoDzKAe5xmc7hCwe3tjZkMpS6WXD5ZyKD1JjzpzKUuGPBbYr7TjVKrm3ioEz9anT2wJSRMLjcBdrcJnpm1FdhdL',
  },
  {
    id: '3',
    walletAddress: '5QAe7JSKTJ8HXBSFz3JQBs1DjrWZ9PAGZJmiNGZ2pYJc',
    tokenAddress: 'DFXyG7CSHwJmfWCawsabNR2d8yy3NjHqPj31xLJGS9Qj',
    tokenName: 'SquidMoon',
    tokenSymbol: 'SQUID',
    activityType: 'buy',
    amount: 45000,
    value: 175000,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    transactionHash: '38zA94VmkNQXWW6cV1LvkyLWGUCQBymZaeE3HAK1JM4YrJrnYBwKWBpKjmxYxAMfFvUsLE8vJcoHax4sxLcHYMUz',
  }
];

async function fetchTokenInfoFromHelius(mintAddress: string): Promise<HeliusTokenData | null> {
  try {
    const response = await fetch(`${HELIUS_API_URL}/token-metadata?mint=${mintAddress}`);
    if (!response.ok) {
      console.warn(`Helius API failed for ${mintAddress}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: HeliusTokenData[] = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching token info from Helius:', error);
    return null;
  }
}

async function fetchTokenPriceFromCoingecko(coingeckoId: string): Promise<number | null> {
  try {
    const response = await fetch(`${COINGECKO_API_URL}/coins/${coingeckoId}`);
    if (!response.ok) {
      console.warn(`Coingecko API failed for ${coingeckoId}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    return data?.market_data?.current_price?.usd || null;
  } catch (error) {
    console.error('Error fetching token price from Coingecko:', error);
    return null;
  }
}

export async function getTokenInfo(mintAddress: string): Promise<TokenInfo | null> {
  try {
    // First try Helius API
    const heliusData = await fetchTokenInfoFromHelius(mintAddress);
    
    if (heliusData) {
      const supply = heliusData.supply || "0";
      const decimals = heliusData.decimals || 0;
      
      // Convert supply to a standardized format
      const totalSupply = typeof supply === 'string' ? supply : supply.toString();
      
      return {
        address: mintAddress,
        name: heliusData.name || 'Unknown Token',
        symbol: heliusData.symbol || 'UNKNOWN',
        logoURI: heliusData.logoURI || '',
        decimals: decimals,
        supply: totalSupply,
        coingeckoId: heliusData.extensions?.coingeckoId || null,
        lastUpdatedAt: heliusData.lastUpdatedAt || null,
        description: heliusData.description || null,
        twitter: heliusData.twitter || null,
        website: heliusData.website || null,
      };
    }
    
    // Fallback: If Helius doesn't have the data, return null
    console.warn(`No token data found in Helius for mint address: ${mintAddress}`);
    return null;
    
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
}

export async function getTokenPrice(coingeckoId: string): Promise<number | null> {
  if (!coingeckoId) {
    console.warn('No Coingecko ID provided, skipping price fetch.');
    return null;
  }

  try {
    const price = await fetchTokenPriceFromCoingecko(coingeckoId);
    return price;
  } catch (error) {
    console.error('Error fetching token price:', error);
    return null;
  }
}

// Convert TokenInfo to Token format with additional data
export function tokenInfoToToken(tokenInfo: TokenInfo): Token {
  // For demo purposes, we'll generate some random data
  const price = Math.random() * 0.01;
  const marketCap = price * parseInt(tokenInfo.supply || "0") / Math.pow(10, tokenInfo.decimals);
  const change24h = Math.random() * 40 - 10; // -10% to +30%
  
  return {
    address: tokenInfo.address,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    logoURI: tokenInfo.logoURI,
    price: price,
    marketCap: marketCap,
    change24h: change24h,
    qualityScore: Math.floor(Math.random() * 30) + 60, // 60-90
    createdAt: tokenInfo.lastUpdatedAt ? new Date(tokenInfo.lastUpdatedAt) : new Date(),
    source: "API Data",
    isPumpFun: tokenInfo.name.toLowerCase().includes('pump') || tokenInfo.symbol.toLowerCase().includes('pump'),
  };
}

// Get recent token activity
export async function getRecentTokenActivity(): Promise<TokenInfo[]> {
  // This would normally call the API, but for now we'll use mock data
  try {
    // Return mock token info
    const mockTokenInfos: TokenInfo[] = MOCK_TOKEN_DATA.map(token => ({
      address: token.address,
      name: token.name,
      symbol: token.symbol,
      logoURI: token.logoURI,
      decimals: 9,
      supply: "1000000000",
      coingeckoId: null,
      lastUpdatedAt: token.createdAt.getTime(),
      description: null,
      twitter: null,
      website: null
    }));
    
    return mockTokenInfos;
  } catch (error) {
    console.error('Error getting recent token activity:', error);
    return [];
  }
}

// Get trending tokens
export async function getTrendingTokens(): Promise<TokenInfo[]> {
  // This would normally call trending APIs, but for now we'll use mock data
  try {
    // Filter for trending tokens
    const trendingTokens = MOCK_TOKEN_DATA
      .filter(t => t.trendingScore && (typeof t.trendingScore === 'number' ? t.trendingScore > 1 : t.trendingScore.length > 1))
      .map(token => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        decimals: 9,
        supply: "1000000000",
        coingeckoId: null,
        lastUpdatedAt: token.createdAt.getTime(),
        description: null,
        twitter: null,
        website: null
      }));
    
    return trendingTokens;
  } catch (error) {
    console.error('Error getting trending tokens:', error);
    return [];
  }
}

// Get pump.fun tokens
export async function getPumpFunTokens(): Promise<TokenInfo[]> {
  // This would normally call the Pump.fun API, but for now we'll use mock data
  try {
    // Filter for pump.fun tokens
    const pumpFunTokens = MOCK_TOKEN_DATA
      .filter(t => t.isPumpFun)
      .map(token => ({
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        logoURI: token.logoURI,
        decimals: 9,
        supply: "1000000000",
        coingeckoId: null,
        lastUpdatedAt: token.createdAt.getTime(),
        description: null,
        twitter: null,
        website: null
      }));
    
    return pumpFunTokens;
  } catch (error) {
    console.error('Error getting pump.fun tokens:', error);
    return [];
  }
}

// Track wallet activities
export async function trackWalletActivities(walletAddresses: string[]): Promise<WalletActivity[]> {
  // This would normally call an API to track wallet activities, but for now we'll use mock data
  try {
    // Filter for activities from the tracked wallets
    return MOCK_WALLET_ACTIVITIES.filter(activity => 
      walletAddresses.includes(activity.walletAddress)
    );
  } catch (error) {
    console.error('Error tracking wallet activities:', error);
    return [];
  }
}

// Fetch token metadata
export async function fetchTokenMetadata(tokenAddress: string): Promise<TokenInfo | null> {
  return getTokenInfo(tokenAddress);
}

// Test Helius connection
export async function testHeliusConnection(): Promise<boolean> {
  try {
    // Simulate API test
    console.log("Testing Helius connection...");
    // In a real implementation, this would make an actual API call
    return true;
  } catch (error) {
    console.error('Error testing Helius connection:', error);
    return false;
  }
}
