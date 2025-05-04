
import { TradingPositionData } from '@/types/database.types';
import { rateLimit } from '@/utils/rateLimit';

// Cache for token data to reduce API calls
const tokenDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

/**
 * Clears expired entries from token data cache
 */
export const cleanupTokenDataCache = () => {
  const now = Date.now();
  for (const [key, value] of tokenDataCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRY) {
      tokenDataCache.delete(key);
    }
  }
};

/**
 * Gets cached token data or returns null if not in cache or expired
 */
const getCachedTokenData = (key: string) => {
  const cachedData = tokenDataCache.get(key);
  if (!cachedData) return null;
  
  const now = Date.now();
  if (now - cachedData.timestamp > CACHE_EXPIRY) {
    tokenDataCache.delete(key);
    return null;
  }
  
  return cachedData.data;
};

/**
 * Stores data in token cache
 */
const cacheTokenData = (key: string, data: any) => {
  tokenDataCache.set(key, { data, timestamp: Date.now() });
};

// Setup rate limiting for various APIs
const heliusLimit = rateLimit(50); // 50 requests per minute
const birdEyeLimit = rateLimit(45); // 45 requests per minute
const jupiterLimit = rateLimit(10);  // 10 requests per minute
const pumpFunLimit = rateLimit(10);  // 10 requests per minute
const dexScreenerLimit = rateLimit(10); // 10 requests per minute

// API constants
const HELIUS_API_KEY = 'a18d2c93-d9fa-4db2-8419-707a4f1782f7';
const BIRDEYE_API_KEY = '67f79318c29e4eda99c3184c2ac65116';

/**
 * Test Helius API connection
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const url = `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: ['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'] }) // BONK token as test
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to connect to Helius API:', error);
    return false;
  }
};

/**
 * Fetches token metadata using Helius API
 */
export const fetchTokenMetadata = async (contractAddress: string) => {
  const cacheKey = `metadata_${contractAddress}`;
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData;
  
  await heliusLimit();
  
  try {
    const url = `https://api.helius.xyz/v0/tokens/metadata?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mintAccounts: [contractAddress] })
    });
    
    if (!response.ok) {
      throw new Error(`Helius API response: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && Array.isArray(data) && data.length > 0) {
      cacheTokenData(cacheKey, data[0]);
      return data[0];
    }
    
    throw new Error('No token metadata found');
  } catch (error) {
    console.error('Error fetching token metadata from Helius:', error);
    throw error;
  }
};

/**
 * Alias for fetchTokenMetadata to match function calls in components
 */
export const getTokenMetadata = fetchTokenMetadata;

/**
 * Fetches token information using BirdEye API
 */
export const fetchTokenInfo = async (contractAddress: string) => {
  const cacheKey = `tokeninfo_${contractAddress}`;
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData;
  
  await birdEyeLimit();
  
  try {
    const url = `https://public-api.birdeye.so/defi/token_info?address=${contractAddress}`;
    const response = await fetch(url, {
      headers: { 'X-API-KEY': BIRDEYE_API_KEY }
    });
    
    if (!response.ok) {
      throw new Error(`BirdEye API response: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.success) {
      cacheTokenData(cacheKey, data.data);
      return data.data;
    }
    
    throw new Error('No token info found or API error');
  } catch (error) {
    console.error('Error fetching token info from BirdEye:', error);
    throw error;
  }
};

/**
 * Fetches price data from Jupiter API
 */
export const fetchJupiterPrice = async (contractAddress: string) => {
  const cacheKey = `jupiter_${contractAddress}`;
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData;
  
  await jupiterLimit();
  
  try {
    const url = `https://api.jup.ag/api/price/v4/price?ids=${contractAddress}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Jupiter API response: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.data && data.data[contractAddress]) {
      cacheTokenData(cacheKey, data.data[contractAddress]);
      return data.data[contractAddress];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching price from Jupiter:', error);
    return null;
  }
};

/**
 * Checks if a token is a Pump.fun token
 */
export const isPumpFunToken = (contractAddress: string | null): boolean => {
  if (!contractAddress) return false;
  return contractAddress.toLowerCase().endsWith('pump') || contractAddress.toLowerCase().endsWith('boop');
};

/**
 * Fetches Pump.fun token data if applicable
 */
export const fetchPumpFunData = async (contractAddress: string) => {
  if (!isPumpFunToken(contractAddress)) {
    return null;
  }
  
  const cacheKey = `pumpfun_${contractAddress}`;
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData;
  
  await pumpFunLimit();
  
  try {
    const url = `https://api.pump.fun/token/${contractAddress}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pump.fun API response: ${response.status}`);
    }
    
    const data = await response.json();
    cacheTokenData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching data from Pump.fun:', error);
    return null;
  }
};

/**
 * Get Pump.fun tokens
 */
export const getPumpFunTokens = async (limit = 10) => {
  const cacheKey = 'pumpfun_tokens';
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData.slice(0, limit);
  
  await pumpFunLimit();
  
  try {
    const url = `https://api.pump.fun/trending`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Pump.fun API response: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.trending_tokens && Array.isArray(data.trending_tokens)) {
      const tokens = data.trending_tokens.map(token => ({
        name: token.name || 'Unknown Pump.fun Token',
        symbol: token.name?.toUpperCase() || 'PUMP',
        address: token.token_mint,
        price: parseFloat(token.price) || 0,
        change24h: parseFloat(token.price_change_24h || 0),
        volume: parseFloat(token.volume_24h || 0),
        liquidity: parseFloat(token.liquidity || 0),
        marketCap: parseFloat(token.market_cap || 0),
        holders: token.holders || 0,
        isPumpFun: true,
        createdAt: token.created_at ? new Date(token.created_at) : new Date(),
        source: 'Pump.fun'
      }));
      
      cacheTokenData(cacheKey, tokens);
      return tokens.slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching Pump.fun tokens:', error);
    return [];
  }
};

/**
 * Fetches DexScreener data for a token
 */
export const fetchDexScreenerData = async (contractAddress: string) => {
  const cacheKey = `dexscreener_${contractAddress}`;
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData;
  
  await dexScreenerLimit();
  
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`DexScreener API response: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.pairs && data.pairs.length > 0) {
      cacheTokenData(cacheKey, data);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching data from DexScreener:', error);
    return null;
  }
};

/**
 * Gets trending tokens from various sources
 */
export const getTrendingTokens = async (limit = 20) => {
  const cacheKey = 'trending_tokens';
  const cachedData = getCachedTokenData(cacheKey);
  if (cachedData) return cachedData.slice(0, limit);
  
  const trendingTokens = new Map();
  
  try {
    // Jupiter trending
    await jupiterLimit();
    try {
      const jupRes = await fetch('https://station.jup.ag/api/trending-tokens');
      if (jupRes.ok) {
        const jupData = await jupRes.json();
        if (jupData && Array.isArray(jupData)) {
          jupData.forEach((token, index) => {
            if (token.address) {
              const existing = trendingTokens.get(token.address) || { 
                address: token.address, 
                name: token.name || '', 
                symbol: token.symbol || '',
                sources: [], 
                score: 0 
              };
              existing.sources.push({ name: 'Jupiter', rank: index + 1 });
              existing.score += 10 - Math.min(index, 9); // 10 points for #1, down to 1 point for #10+
              trendingTokens.set(token.address, existing);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Jupiter trending:', err);
    }
    
    // Raydium trending
    try {
      const rayRes = await fetch('https://api.raydium.io/v2/main/trending-tokens');
      if (rayRes.ok) {
        const rayData = await rayRes.json();
        if (rayData && Array.isArray(rayData)) {
          rayData.forEach((token, index) => {
            if (token.mint) {
              const existing = trendingTokens.get(token.mint) || { 
                address: token.mint, 
                name: token.name || '', 
                symbol: token.symbol || '',
                sources: [], 
                score: 0 
              };
              existing.sources.push({ name: 'Raydium', rank: index + 1 });
              existing.score += 8 - Math.min(index, 7); // 8 points for #1, down to 1 point for #8+
              trendingTokens.set(token.mint, existing);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Raydium trending:', err);
    }
    
    // Pump.fun trending
    await pumpFunLimit();
    try {
      const pumpRes = await fetch('https://api.pump.fun/trending');
      if (pumpRes.ok) {
        const pumpData = await pumpRes.json();
        if (pumpData && Array.isArray(pumpData.trending_tokens)) {
          pumpData.trending_tokens.forEach((token, index) => {
            if (token.token_mint) {
              const existing = trendingTokens.get(token.token_mint) || { 
                address: token.token_mint, 
                name: token.name || '', 
                symbol: token.name?.toUpperCase() || '',
                sources: [], 
                score: 0 
              };
              existing.sources.push({ name: 'Pump.fun', rank: index + 1 });
              existing.score += 12 - Math.min(index, 11); // 12 points for #1, down to 1 point for #12+
              trendingTokens.set(token.token_mint, existing);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching Pump.fun trending:', err);
    }
    
    // DexScreener trending
    await dexScreenerLimit();
    try {
      const dexRes = await fetch('https://api.dexscreener.com/latest/dex/search?q=trending');
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        if (dexData && Array.isArray(dexData.pairs)) {
          dexData.pairs.filter(pair => pair.chainId === 'solana').forEach((pair, index) => {
            if (pair.baseToken?.address) {
              const existing = trendingTokens.get(pair.baseToken.address) || { 
                address: pair.baseToken.address, 
                name: pair.baseToken.name || '', 
                symbol: pair.baseToken.symbol || '',
                sources: [], 
                score: 0 
              };
              existing.sources.push({ name: 'DexScreener', rank: index + 1 });
              existing.score += 9 - Math.min(index, 8); // 9 points for #1, down to 1 point for #9+
              trendingTokens.set(pair.baseToken.address, existing);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error fetching DexScreener trending:', err);
    }
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
  }
  
  // Convert map to array and sort by score
  const result = Array.from(trendingTokens.values())
    .sort((a, b) => b.score - a.score)
    .map(token => ({
      name: token.name,
      symbol: token.symbol,
      address: token.address,
      price: 0, // Will be populated with actual price data later if needed
      marketCap: 0,
      liquidity: 0,
      holders: 0,
      qualityScore: token.score,
      trendingScore: token.score,
      trendingSources: token.sources.map(s => s.name),
      source: token.sources.map(s => s.name).join(', '),
      createdAt: new Date()
    }));
  
  cacheTokenData(cacheKey, result);
  return result.slice(0, limit);
};

/**
 * Get recent token activity
 */
export const getRecentTokenActivity = async () => {
  const cacheKey = 'recent_token_activity';
  const cachedData = getCachedTokenData(cacheKey);
  
  // Only use cache if it's less than 1 minute old for recent activity
  if (cachedData && Date.now() - tokenDataCache.get(cacheKey)!.timestamp < 60000) {
    return cachedData;
  }
  
  try {
    // For demo purposes, generate some example token activity
    // In a real app, this would fetch from Helius or another API
    const tokens = [
      {
        name: "Bonk",
        symbol: "BONK",
        address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        price: 0.000017,
        marketCap: 9800000,
        liquidity: 7500000,
        holders: 350000,
        qualityScore: 85,
        source: "Birdeye",
        createdAt: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        change24h: 12.5
      },
      {
        name: "Jupiter",
        symbol: "JUP",
        address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
        price: 0.78,
        marketCap: 1200000000,
        liquidity: 45000000,
        holders: 89000,
        qualityScore: 92,
        source: "Helius",
        createdAt: new Date(Date.now() - 45 * 60000), // 45 minutes ago
        change24h: -2.3
      },
      {
        name: "WEN Token",
        symbol: "WEN",
        address: "AFbX8oGjGpmVFywbVouvhQSRmiW2aR1mohfahi4Y2AdB",
        price: 0.00021,
        marketCap: 15000000,
        liquidity: 1200000,
        holders: 45000,
        qualityScore: 78,
        source: "Birdeye",
        createdAt: new Date(Date.now() - 65 * 60000), // 65 minutes ago
        change24h: 5.8
      },
      {
        name: "CryptoDoggies",
        symbol: "DOGS",
        address: "FmG9zkU5khYd1G8yCUFABkZfqGSNRx7DTssDevRjjXbm",
        price: 0.0045,
        marketCap: 3500000,
        liquidity: 850000,
        holders: 12000,
        qualityScore: 72,
        source: "Helius",
        createdAt: new Date(Date.now() - 110 * 60000), // 110 minutes ago
        change24h: 28.7,
        isPumpFun: true
      }
    ];
    
    cacheTokenData(cacheKey, tokens);
    return tokens;
  } catch (error) {
    console.error('Error fetching recent token activity:', error);
    return [];
  }
};

/**
 * Track wallet activities
 */
export const trackWalletActivities = async (walletAddresses: string[]) => {
  const cacheKey = `wallets_${walletAddresses.join('_')}`;
  const cachedData = getCachedTokenData(cacheKey);
  
  // Use cache if less than 5 minutes old for wallet tracking
  if (cachedData && Date.now() - tokenDataCache.get(cacheKey)!.timestamp < 300000) {
    return cachedData;
  }
  
  try {
    // In a real app, this would fetch real wallet activity from Helius
    // For demo purposes, we'll simulate wallet transaction data
    const walletActivities = walletAddresses.map(address => ({
      walletAddress: address,
      transactions: [
        {
          transaction: {
            signatures: [`sim_${address.substring(0, 8)}_${Date.now()}`]
          },
          meta: {
            preBalances: [105000000, 0],
            postBalances: [100000000, 5000000],
            preTokenBalances: [],
            postTokenBalances: [
              {
                mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
                owner: address,
                uiTokenAmount: {
                  amount: "15000000000",
                  decimals: 5,
                  uiAmount: 150000
                }
              }
            ]
          },
          blockTime: Math.floor(Date.now() / 1000) - 300 // 5 minutes ago
        }
      ]
    }));
    
    cacheTokenData(cacheKey, walletActivities);
    return walletActivities;
  } catch (error) {
    console.error('Error tracking wallet activities:', error);
    return [];
  }
};

/**
 * Comprehensive token data fetching with fallbacks
 */
export const getComprehensiveTokenData = async (contractAddress: string) => {
  const isPumpToken = isPumpFunToken(contractAddress);
  let tokenData: any = { address: contractAddress };
  
  try {
    // Try to get token metadata from Helius
    try {
      const metadata = await fetchTokenMetadata(contractAddress);
      if (metadata) {
        tokenData.name = metadata.name || tokenData.name;
        tokenData.symbol = metadata.symbol || tokenData.symbol;
        tokenData.decimals = metadata.decimals;
        tokenData.logoURI = metadata.logo || tokenData.logoURI;
      }
    } catch (err) {
      console.log(`Helius metadata error for ${contractAddress}:`, err);
    }
    
    // If it's a Pump.fun token, get data from Pump.fun
    if (isPumpToken) {
      const pumpData = await fetchPumpFunData(contractAddress);
      if (pumpData) {
        // Extract name from contract address for Pump tokens
        const baseName = contractAddress.split(/pump|boop/i)[0];
        const cleanName = baseName
          .replace(/[0-9]/g, '')
          .replace(/([A-Z])/g, ' $1')
          .trim();
          
        tokenData.name = tokenData.name || cleanName || pumpData.name || 'Unknown Token';
        tokenData.symbol = tokenData.symbol || (cleanName ? cleanName.toUpperCase() : 'UNKNOWN');
        tokenData.pumpFun = true;
        tokenData.pumpData = pumpData;
      }
    }
    
    // Try to get token info from BirdEye
    try {
      const info = await fetchTokenInfo(contractAddress);
      if (info) {
        tokenData.name = tokenData.name || info.name;
        tokenData.symbol = tokenData.symbol || info.symbol;
        tokenData.decimals = tokenData.decimals || info.decimals;
        tokenData.price = info.price;
        tokenData.priceChange24h = info.priceChange24h;
        tokenData.volume24h = info.volume24h;
        tokenData.marketCap = info.marketCap;
        tokenData.liquidity = info.liquidity;
        tokenData.holders = info.holders;
      }
    } catch (err) {
      console.log(`BirdEye info error for ${contractAddress}:`, err);
    }
    
    // Get Jupiter price as backup
    try {
      const jupPrice = await fetchJupiterPrice(contractAddress);
      if (jupPrice && jupPrice.price) {
        tokenData.price = tokenData.price || jupPrice.price;
      }
    } catch (err) {
      console.log(`Jupiter price error for ${contractAddress}:`, err);
    }
    
    // Get DexScreener data for additional insights
    try {
      const dexData = await fetchDexScreenerData(contractAddress);
      if (dexData && dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs[0];
        tokenData.name = tokenData.name || pair.baseToken.name;
        tokenData.symbol = tokenData.symbol || pair.baseToken.symbol;
        tokenData.price = tokenData.price || parseFloat(pair.priceUsd);
        tokenData.priceChange24h = tokenData.priceChange24h || pair.priceChange.h24;
        tokenData.volume24h = tokenData.volume24h || parseFloat(pair.volume.h24);
        tokenData.liquidity = tokenData.liquidity || parseFloat(pair.liquidity.usd);
      }
    } catch (err) {
      console.log(`DexScreener error for ${contractAddress}:`, err);
    }
    
    // If name still not found, use contract abbreviation
    if (!tokenData.name) {
      tokenData.name = `Token ${contractAddress.substring(0, 4)}...${contractAddress.substring(contractAddress.length - 4)}`;
    }
    
    // If symbol still not found, derive from name
    if (!tokenData.symbol && tokenData.name) {
      tokenData.symbol = tokenData.name.substring(0, 5).toUpperCase();
    }
    
    return tokenData;
  } catch (error) {
    console.error(`Failed to get comprehensive data for token ${contractAddress}:`, error);
    return { address: contractAddress, name: `Unknown Token (${contractAddress.substring(0, 4)}...)`, symbol: 'UNKNOWN', error: true };
  }
};
