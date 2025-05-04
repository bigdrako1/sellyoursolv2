import { getActiveApiConfig } from '@/config/appDefinition';
import { TradingPosition, ScaleOutEvent } from '@/utils/tradingUtils';

// Cache for API responses
const apiCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Tests connection to the Helius RPC API
 * @returns Promise<boolean> - True if connection is successful
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const apiConfig = getActiveApiConfig();
    const response = await fetch(apiConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    
    const data = await response.json();
    return data && data.result === 'ok';
  } catch (error) {
    console.error('Error testing Helius connection:', error);
    return false;
  }
};

/**
 * Makes an RPC call to Helius API
 * @param method RPC method name
 * @param params Method parameters
 * @returns Promise with the RPC response
 */
export const heliusRpcCall = async (method: string, params: any[] = []): Promise<any> => {
  try {
    const apiConfig = getActiveApiConfig();
    const response = await fetch(apiConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`RPC call failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error in heliusRpcCall (${method}):`, error);
    throw error;
  }
};

/**
 * Makes an API call to Helius REST API
 * @param endpoint API endpoint path (without the base URL)
 * @param params Optional query parameters
 * @returns Promise with the API response
 */
export const heliusApiCall = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  try {
    const apiConfig = getActiveApiConfig();
    
    // Add API key if not already in the params
    if (!params.apiKey && !endpoint.includes('api-key')) {
      params.apiKey = apiConfig.apiKey;
    }
    
    // Build query string
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const url = `${apiConfig.baseUrl}/${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in heliusApiCall (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Makes an API call to BirdEye API
 * @param endpoint API endpoint path
 * @param params Optional query parameters
 * @returns Promise with the API response
 */
export const birdEyeApiCall = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  try {
    const API_KEY = '67f79318c29e4eda99c3184c2ac65116'; // BirdEye API key
    const BASE_URL = 'https://public-api.birdeye.so';
    
    const url = `${BASE_URL}/${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`BirdEye API call failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in birdEyeApiCall (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Get recent token activity from Helius API
 * @returns Promise with recent token activity data
 */
export const getRecentTokenActivity = async (): Promise<any[]> => {
  const cacheKey = 'recent_token_activity';
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Since the direct endpoint is returning 404, we'll use a different approach
    // Use parsedTransaction to get recent SPL token transactions
    const response = await heliusRpcCall('getRecentTokenTransfers', []);
    
    if (!response || !Array.isArray(response)) {
      throw new Error('Invalid response format');
    }
    
    // Process the token data to match our expected format
    const tokenActivity = await Promise.all(response.map(async (tx: any) => {
      // Extract the token address from the transaction
      const tokenAddress = tx.token?.address || tx.tokenAddress || '';
      
      if (!tokenAddress) return null;
      
      // Get token metadata
      const tokenInfo = await getTokenMetadata(tokenAddress);
      
      // Check if it's a Pump.fun token
      const isPumpFunToken = await isPumpFunToken(tokenAddress);
      
      return {
        name: tokenInfo?.name || 'Unknown Token',
        symbol: tokenInfo?.symbol || '???',
        address: tokenAddress,
        price: tokenInfo?.price || 0,
        marketCap: tokenInfo?.marketCap || 0,
        liquidity: tokenInfo?.liquidity || 0,
        holders: tokenInfo?.holders || 0,
        qualityScore: calculateTokenQuality(tokenInfo),
        source: isPumpFunToken ? 'Pump.fun' : 'Helius',
        createdAt: new Date(tx.blockTime * 1000 || Date.now()),
        isPumpFun: isPumpFunToken
      };
    }));
    
    // Filter out null values and take only the first 10
    const validTokens = tokenActivity.filter(token => token !== null).slice(0, 10);
    
    // Cache the results
    apiCache.set(cacheKey, {
      data: validTokens,
      timestamp: Date.now()
    });
    
    return validTokens;
  } catch (error) {
    console.error('Error fetching recent token activity:', error);
    
    // If real data fails, return an empty array rather than mock data
    return [];
  }
};

/**
 * Check if a token is a Pump.fun token
 * @param tokenAddress Token address to check
 * @returns Promise<boolean> - True if it's a Pump.fun token
 */
export const isPumpFunToken = async (tokenAddress: string): Promise<boolean> => {
  try {
    // First check if the address has "pump" or "boop" suffix
    if (tokenAddress.toLowerCase().endsWith('pump') || tokenAddress.toLowerCase().endsWith('boop')) {
      return true;
    }
    
    // Then try to fetch from pump.fun API
    const response = await fetch(`https://api.pump.fun/token/${tokenAddress}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Get token metadata from Helius API
 * @param tokenAddress Token address
 * @returns Promise with token metadata
 */
export const getTokenMetadata = async (tokenAddress: string): Promise<any> => {
  const cacheKey = `token_metadata_${tokenAddress}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // First try Helius API
    const heliusResponse = await heliusApiCall('tokens/metadata', {
      tokens: [tokenAddress]
    });
    
    if (heliusResponse && Array.isArray(heliusResponse) && heliusResponse.length > 0) {
      const tokenData = heliusResponse[0];
      
      // Cache the results
      apiCache.set(cacheKey, {
        data: tokenData,
        timestamp: Date.now()
      });
      
      return tokenData;
    }
    
    // If Helius fails, try BirdEye
    const birdEyeResponse = await birdEyeApiCall(`public/tokenInfo?address=${tokenAddress}`);
    
    if (birdEyeResponse && birdEyeResponse.data) {
      const tokenData = {
        ...birdEyeResponse.data,
        name: birdEyeResponse.data.name || 'Unknown Token',
        symbol: birdEyeResponse.data.symbol || '???',
        address: tokenAddress,
        price: birdEyeResponse.data.price || 0,
        marketCap: birdEyeResponse.data.marketCap || 0,
        liquidity: birdEyeResponse.data.liquidity || 0,
        holders: birdEyeResponse.data.holders || 0
      };
      
      // Cache the results
      apiCache.set(cacheKey, {
        data: tokenData,
        timestamp: Date.now()
      });
      
      return tokenData;
    }
    
    // If all fails, try pump.fun API if it might be a pump token
    if (tokenAddress.toLowerCase().endsWith('pump') || tokenAddress.toLowerCase().endsWith('boop')) {
      try {
        const pumpResponse = await fetch(`https://api.pump.fun/token/${tokenAddress}`);
        if (pumpResponse.ok) {
          const pumpData = await pumpResponse.json();
          
          const tokenData = {
            name: pumpData.name || pumpData.symbol || 'Pump Token',
            symbol: pumpData.symbol || tokenAddress.slice(0, 4).toUpperCase(),
            address: tokenAddress,
            price: pumpData.price || 0,
            marketCap: pumpData.marketCap || 0,
            liquidity: pumpData.liquidity || 0,
            holders: pumpData.holders || 0,
            isPumpFun: true
          };
          
          // Cache the results
          apiCache.set(cacheKey, {
            data: tokenData,
            timestamp: Date.now()
          });
          
          return tokenData;
        }
      } catch (e) {
        console.error("Error fetching from pump.fun API:", e);
        // Continue to return null below
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching token metadata for ${tokenAddress}:`, error);
    return null;
  }
};

/**
 * Get specific pump.fun tokens
 * @param limit Number of tokens to return
 * @returns Array of pump.fun token data
 */
export const getPumpFunTokens = async (limit: number = 10): Promise<any[]> => {
  const cacheKey = 'pump_fun_tokens';
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data.slice(0, limit);
  }
  
  try {
    console.log('Fetching pump.fun tokens...');
    
    // Fetch from Pump.fun API
    const response = await fetch('https://api.pump.fun/trending');
    
    if (!response.ok) {
      throw new Error(`Pump.fun API returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.tokens || !Array.isArray(data.tokens)) {
      throw new Error('Invalid response format from Pump.fun API');
    }
    
    const pumpTokens = await Promise.all(data.tokens.map(async (token: any) => {
      try {
        // Try to get more details for each token
        const tokenDetails = await getTokenMetadata(token.mint);
        
        return {
          name: token.name || tokenDetails?.name || 'Pump Token',
          symbol: token.symbol || tokenDetails?.symbol || token.mint.slice(0, 4).toUpperCase(),
          address: token.mint,
          price: token.price || tokenDetails?.price || 0,
          marketCap: tokenDetails?.marketCap || 0, 
          liquidity: tokenDetails?.liquidity || 0,
          holders: tokenDetails?.holders || 0,
          change24h: token.change24h || 0,
          source: 'Pump.fun',
          createdAt: token.createdAt ? new Date(token.createdAt) : new Date(),
          isPumpFun: true
        };
      } catch (error) {
        console.error(`Error enriching pump token data for ${token.mint}:`, error);
        
        return {
          name: token.name || 'Pump Token',
          symbol: token.symbol || token.mint.slice(0, 4).toUpperCase(),
          address: token.mint, 
          price: token.price || 0,
          source: 'Pump.fun',
          isPumpFun: true
        };
      }
    }));
    
    // Cache the results
    apiCache.set(cacheKey, {
      data: pumpTokens,
      timestamp: Date.now()
    });
    
    return pumpTokens.slice(0, limit);
  } catch (error) {
    console.error("Error fetching pump.fun tokens:", error);
    return [];
  }
};

/**
 * Calculate token quality score based on multiple factors
 * @param tokenInfo Token data
 * @returns Quality score (0-100)
 */
export const calculateTokenQuality = (tokenInfo: any): number => {
  if (!tokenInfo) return 0;
  
  let score = 0;
  
  // Liquidity factor (0-20 points)
  if (tokenInfo.liquidity >= 1000000) score += 20;
  else if (tokenInfo.liquidity >= 500000) score += 15;
  else if (tokenInfo.liquidity >= 100000) score += 10;
  else if (tokenInfo.liquidity >= 50000) score += 5;
  else if (tokenInfo.liquidity < 25000) score -= 10;
  
  // Holders factor (0-15 points)
  if (tokenInfo.holders >= 1000) score += 15;
  else if (tokenInfo.holders >= 500) score += 10;
  else if (tokenInfo.holders >= 100) score += 5;
  else if (tokenInfo.holders < 25) score -= 10;
  
  // Age factor (0-10 points)
  const tokenAge = tokenInfo.age || 0;
  if (tokenAge >= 30) score += 10;
  else if (tokenAge >= 7) score += 5;
  else if (tokenAge >= 1) score += 2;
  
  // Risk score factor (0-20 points)
  const riskScore = tokenInfo.riskScore || 50;
  if (riskScore < 20) score += 20;
  else if (riskScore < 40) score += 10;
  else if (riskScore < 60) score += 0;
  else if (riskScore < 80) score -= 10;
  else if (riskScore >= 80) score -= 20;
  
  // Trending factor (0-10 points)
  if (tokenInfo.isTrending) score += 10;
  
  // Pump.fun bonus (0-5 points)
  if (tokenInfo.isPumpFun) score += 5;
  
  // Additional factors
  const volume = tokenInfo.volume24h || 0;
  if (volume > 1000000) score += 10;
  else if (volume > 500000) score += 5;
  else if (volume > 100000) score += 3;
  
  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, score + 50)); // Base of 50 plus adjustments
};

/**
 * Get Solana price from a reliable API
 * @returns Current SOL price in USD
 */
export const getSolPrice = async (): Promise<number> => {
  const cacheKey = 'sol_price';
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // Try to get price from BirdEye
    const response = await birdEyeApiCall('public/price?address=So11111111111111111111111111111111111111112');
    
    if (response && response.data) {
      const price = response.data.value;
      
      apiCache.set(cacheKey, {
        data: price,
        timestamp: Date.now()
      });
      
      return price;
    }
    
    // If BirdEye fails, try another API (like CoinGecko)
    const backupResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const backupData = await backupResponse.json();
    
    if (backupData && backupData.solana && backupData.solana.usd) {
      const price = backupData.solana.usd;
      
      apiCache.set(cacheKey, {
        data: price,
        timestamp: Date.now()
      });
      
      return price;
    }
    
    // If all fails, return a fallback price
    return 150.00;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 150.00; // Fallback price
  }
};

/**
 * Get trending tokens from various DEX sources
 * @param limit Number of tokens to return
 * @returns Array of trending token data
 */
export const getTrendingTokens = async (limit: number = 10): Promise<any[]> => {
  const cacheKey = 'trending_tokens';
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data.slice(0, limit);
  }
  
  try {
    console.log('Fetching trending tokens from multiple DEX sources...');
    
    // Try to fetch from Jupiter trending API
    const jupiterResponse = await fetch('https://station.jup.ag/api/trending-tokens')
      .then(res => res.json())
      .catch(() => null);
    
    // Try to fetch from Raydium trending API
    const raydiumResponse = await fetch('https://api.raydium.io/v2/main/trending-tokens')
      .then(res => res.json())
      .catch(() => null);
    
    // Try to fetch from Pump.fun trending API
    const pumpFunResponse = await fetch('https://api.pump.fun/trending')
      .then(res => res.json())
      .catch(() => null);
    
    // Try to fetch from BirdEye trending tokens
    const birdEyeResponse = await birdEyeApiCall('defi/token_list?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20')
      .catch(() => null);
    
    const birdEyeData = birdEyeResponse?.data?.tokens || [];
    
    // Combine and deduplicate tokens from all sources
    const allTokens = new Map();
    
    // Process Jupiter tokens
    if (jupiterResponse && Array.isArray(jupiterResponse)) {
      console.log(`Found ${jupiterResponse.length} trending tokens from Jupiter`);
      for (const token of jupiterResponse) {
        if (token.address) {
          allTokens.set(token.address, {
            name: token.name,
            symbol: token.symbol,
            address: token.address,
            price: token.price || 0,
            change24h: token.change24h || 0,
            volume24h: 0,
            source: 'Jupiter',
            isTrending: true,
            trendingSources: ['Jupiter']
          });
        }
      }
    }
    
    // Process Raydium tokens
    if (raydiumResponse && Array.isArray(raydiumResponse)) {
      console.log(`Found ${raydiumResponse.length} trending tokens from Raydium`);
      for (const token of raydiumResponse) {
        if (token.mint) {
          const existingToken = allTokens.get(token.mint);
          if (existingToken) {
            existingToken.trendingSources = [...existingToken.trendingSources, 'Raydium'];
          } else {
            allTokens.set(token.mint, {
              name: token.name,
              symbol: token.symbol,
              address: token.mint,
              price: 0,
              change24h: 0,
              volume24h: 0,
              source: 'Raydium',
              isTrending: true,
              trendingSources: ['Raydium']
            });
          }
        }
      }
    }
    
    // Process Pump.fun tokens
    if (pumpFunResponse && pumpFunResponse.tokens && Array.isArray(pumpFunResponse.tokens)) {
      console.log(`Found ${pumpFunResponse.tokens.length} trending tokens from Pump.fun`);
      for (const token of pumpFunResponse.tokens) {
        if (token.mint) {
          const existingToken = allTokens.get(token.mint);
          if (existingToken) {
            existingToken.trendingSources = [...existingToken.trendingSources, 'Pump.fun'];
          } else {
            allTokens.set(token.mint, {
              name: token.name || "Unknown",
              symbol: token.symbol || token.mint.substring(0, 4),
              address: token.mint,
              price: 0,
              change24h: 0,
              volume24h: 0,
              source: 'Pump.fun',
              isTrending: true,
              trendingSources: ['Pump.fun']
            });
          }
        }
      }
    }
    
    // Process BirdEye tokens
    if (birdEyeData && Array.isArray(birdEyeData)) {
      console.log(`Found ${birdEyeData.length} trending tokens from BirdEye`);
      for (const token of birdEyeData) {
        if (token.address) {
          const existingToken = allTokens.get(token.address);
          if (existingToken) {
            existingToken.price = token.price || existingToken.price;
            existingToken.change24h = token.priceChange24h || existingToken.change24h;
            existingToken.volume24h = token.volume24h || existingToken.volume24h;
            existingToken.trendingSources = [...existingToken.trendingSources, 'BirdEye'];
          } else {
            allTokens.set(token.address, {
              name: token.name,
              symbol: token.symbol,
              address: token.address,
              price: token.price || 0,
              change24h: token.priceChange24h || 0,
              volume24h: token.volume24h || 0,
              source: 'BirdEye',
              isTrending: true,
              trendingSources: ['BirdEye']
            });
          }
        }
      }
    }
    
    // Convert map to array
    let trendingTokens = Array.from(allTokens.values());
    
    // Add trending score based on presence across multiple platforms
    trendingTokens = trendingTokens.map(token => {
      return {
        ...token,
        trendingScore: token.trendingSources.length,
        source: token.trendingSources.join(', ')
      };
    });
    
    // Get additional data for tokens if needed
    const enrichedTokens = await Promise.all(
      trendingTokens.map(async (token) => {
        // If we don't have price data yet, try to get it
        if (token.price === 0) {
          try {
            const tokenInfo = await getTokenMetadata(token.address);
            if (tokenInfo) {
              token.price = tokenInfo.price || 0;
              token.change24h = tokenInfo.priceChange24h || 0;
              token.volume24h = tokenInfo.volume24h || 0;
            }
          } catch (error) {
            console.error(`Error enriching token data for ${token.symbol}:`, error);
          }
        }
        return token;
      })
    );
    
    console.log(`Successfully aggregated ${enrichedTokens.length} trending tokens from all DEXes`);
    
    // Sort by trending score (appear on most platforms) and then by volume
    const sortedTokens = enrichedTokens
      .sort((a, b) => {
        // First sort by trending score (higher is better)
        if (b.trendingScore !== a.trendingScore) {
          return b.trendingScore - a.trendingScore;
        }
        // Then by volume (higher is better)
        return b.volume24h - a.volume24h;
      });
    
    // Cache the results
    apiCache.set(cacheKey, {
      data: sortedTokens,
      timestamp: Date.now()
    });
    
    return sortedTokens.slice(0, limit);
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
};

/**
 * Track wallet activities of known profitable traders
 * @param walletAddresses Array of wallet addresses to track
 * @returns Recent activities of tracked wallets
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<any[]> => {
  if (!walletAddresses || walletAddresses.length === 0) {
    return [];
  }
  
  try {
    // For each wallet address, fetch recent transactions
    const activities = await Promise.all(walletAddresses.map(async (address) => {
      try {
        const cacheKey = `wallet_activity_${address}`;
        const cached = apiCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return cached.data;
        }
        
        // Get recent transactions for this wallet directly from Helius API
        const response = await heliusRpcCall('getSignaturesForAddress', [address, { limit: 5 }]);
        
        if (!response || !Array.isArray(response)) {
          throw new Error(`Invalid response for wallet ${address}`);
        }
        
        // Get transaction details
        const txDetails = await Promise.all(response.map(async (tx: any) => {
          try {
            const txResponse = await heliusRpcCall('getTransaction', [tx.signature, { maxSupportedTransactionVersion: 0 }]);
            return txResponse;
          } catch (error) {
            console.error(`Error getting transaction details for ${tx.signature}:`, error);
            return null;
          }
        }));
        
        const walletActivity = {
          walletAddress: address,
          transactions: txDetails.filter(tx => tx !== null),
          lastUpdated: new Date().toISOString(),
        };
        
        // Cache the results
        apiCache.set(cacheKey, {
          data: walletActivity,
          timestamp: Date.now()
        });
        
        return walletActivity;
      } catch (error) {
        console.error(`Error fetching activities for wallet ${address}:`, error);
        return {
          walletAddress: address,
          transactions: [],
          error: "Failed to fetch transactions"
        };
      }
    }));
    
    return activities.filter(activity => activity.transactions && activity.transactions.length > 0);
  } catch (error) {
    console.error("Error tracking wallet activities:", error);
    return [];
  }
};

/**
 * Load all trading positions from storage
 * @returns Array of trading positions
 */
export const loadTradingPositions = (): TradingPosition[] => {
  try {
    const storedPositions = localStorage.getItem('trading_positions');
    return storedPositions ? JSON.parse(storedPositions) : [];
  } catch (error) {
    console.error("Error loading trading positions:", error);
    return [];
  }
};

/**
 * Save trading positions to storage
 * @param positions Array of trading positions
 */
export const saveTradingPositions = (positions: TradingPosition[]): void => {
  try {
    localStorage.setItem('trading_positions', JSON.stringify(positions));
  } catch (error) {
    console.error("Error saving trading positions:", error);
  }
};

/**
 * Clean up the API cache periodically
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      apiCache.delete(key);
    }
  }
};

// Set up periodic cache cleanup
setInterval(cleanupCache, 300000); // Clean up every 5 minutes
