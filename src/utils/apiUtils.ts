
import { toast } from "@/hooks/use-toast";
import APP_CONFIG, { getActiveApiConfig } from "@/config/appDefinition";

// Get active API config
const apiConfig = getActiveApiConfig();

// API keys (from config)
export const HELIUS_API_KEY = apiConfig.apiKey || "a18d2c93-d9fa-4db2-8419-707a4f1782f7";
export const BIRDEYE_API_KEY = "67f79318c29e4eda99c3184c2ac65116";
export const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZlMjk1MDllLWQ0YWMtNDI0YS1hMDg4LTBhZTgwNTdkNzgyNyIsIm9yZ0lkIjoiNDQzOTg4IiwidXNlcklkIjoiNDU2ODA3IiwidHlwZUlkIjoiZGYxNjU0MWYtNTJhNy00MGFiLWFiN2EtODYxZTliYmZiN2U4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDU2ODIzODUsImV4cCI6NDkwMTQ0MjM4NX0.eAg55zBFSaFEnnuKA_EmP-u-61Hkb6YqM8v1YhWduAo";

// API endpoints - Using fallbacks to handle missing properties gracefully
export const HELIUS_RPC_URL = apiConfig.rpcUrl || `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_API_BASE = apiConfig.baseUrl || "https://api.helius.xyz/v0";
export const HELIUS_WS_URL = apiConfig.wsUrl || `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_SECURE_RPC = apiConfig.secureRpcUrl || "https://christye-baw30v-fast-mainnet.helius-rpc.com";
export const HELIUS_STAKED_RPC = apiConfig.stakedRpcUrl || `https://staked.helius-rpc.com?api-key=${HELIUS_API_KEY}`;
export const PARSE_TX_URL = (apiConfig as any).parseTransactionsUrl || `https://api.helius.xyz/v0/transactions/?api-key=${HELIUS_API_KEY}`;
export const TX_HISTORY_URL = (apiConfig as any).transactionHistoryUrl || `https://api.helius.xyz/v0/addresses/{address}/transactions/?api-key=${HELIUS_API_KEY}`;

export const BIRDEYE_API_BASE = "https://public-api.birdeye.so";
export const JUPITER_API_BASE = "https://price.jup.ag/v4";

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds cache lifetime

// Interface for tracking API usage
interface ApiUsageStats {
  dailyRequests: number;
  apiCalls: {
    [key: string]: number;
  };
  requestsPerEndpoint: {
    [key: string]: number;
  };
}

// Keep track of API usage
let apiUsageStats: ApiUsageStats = {
  dailyRequests: 0,
  apiCalls: {},
  requestsPerEndpoint: {},
};

/**
 * Test connection to Helius API
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const response = await fetchWithTimeout(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-connection-test',
        method: 'getHealth',
      }),
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.result === "ok" || data.result === 1;
  } catch (error) {
    console.error("Helius API connection failed:", error);
    return false;
  }
};

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, options: any = {}) {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Get cached data or fetch it
 */
const getCachedOrFetch = async (
  cacheKey: string,
  fetchFunction: () => Promise<any>
): Promise<any> => {
  const cachedData = apiCache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }

  try {
    const data = await fetchFunction();
    apiCache.set(cacheKey, { data, timestamp: now });
    return data;
  } catch (error) {
    // If we have stale cached data, return it rather than failing
    if (cachedData) {
      console.log(`Using stale cached data for ${cacheKey}`);
      return cachedData.data;
    }
    throw error;
  }
};

/**
 * Make a direct RPC call to Helius
 */
export const heliusRpcCall = async (method: string, params: any[] = []): Promise<any> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls[method] = (apiUsageStats.apiCalls[method] || 0) + 1;

    const cacheKey = `helius_rpc_${method}_${JSON.stringify(params)}`;

    return await getCachedOrFetch(cacheKey, async () => {
      const response = await fetchWithTimeout(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `helius-${Date.now()}`,
          method,
          params,
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Helius API error: ${data.error.message}`);
      }

      return data.result;
    });
  } catch (error) {
    handleApiError(error, `Helius RPC call (${method})`);
    throw error;
  }
};

/**
 * Make an API call to Helius API endpoints (non-RPC)
 */
export const heliusApiCall = async (endpoint: string, data: any = {}): Promise<any> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.requestsPerEndpoint[endpoint] = (apiUsageStats.requestsPerEndpoint[endpoint] || 0) + 1;

    const cacheKey = `helius_api_${endpoint}_${JSON.stringify(data)}`;

    return await getCachedOrFetch(cacheKey, async () => {
      const url = `${HELIUS_API_BASE}/${endpoint}?api-key=${HELIUS_API_KEY}`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }

      return await response.json();
    });
  } catch (error) {
    handleApiError(error, `Helius API call (${endpoint})`);
    throw error;
  }
};

/**
 * Get API usage statistics
 */
export const getApiUsageStats = async (): Promise<ApiUsageStats> => {
  // In a real implementation, this would fetch from Helius API
  // For now, return combined real and mocked usage stats
  return {
    dailyRequests: apiUsageStats.dailyRequests || Math.floor(Math.random() * 500) + 100,
    apiCalls: {
      ...apiUsageStats.apiCalls,
      getTokenInfo: (apiUsageStats.apiCalls.getTokenInfo || 0) + Math.floor(Math.random() * 50),
      getTransaction: (apiUsageStats.apiCalls.getTransaction || 0) + Math.floor(Math.random() * 30),
    },
    requestsPerEndpoint: {
      ...apiUsageStats.requestsPerEndpoint,
      transactions: (apiUsageStats.requestsPerEndpoint.transactions || 0) + Math.floor(Math.random() * 50),
      tokenMetadata: (apiUsageStats.requestsPerEndpoint.tokenMetadata || 0) + Math.floor(Math.random() * 30),
    }
  };
};

/**
 * Get SOL price
 */
// Store the last successfully fetched SOL price
let lastKnownSolPrice: number | null = null;

export const getSolPrice = async (): Promise<number> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls['getSolPrice'] = (apiUsageStats.apiCalls['getSolPrice'] || 0) + 1;

    const price = await getCachedOrFetch('sol_price', async () => {
      const response = await fetchWithTimeout(`${JUPITER_API_BASE}/price?ids=SOL`, {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const solPrice = data?.data?.SOL?.price || 0;

      // Store the successfully fetched price for future fallbacks
      if (solPrice > 0) {
        lastKnownSolPrice = solPrice;
      }

      return solPrice;
    });

    return price;
  } catch (error) {
    handleApiError(error, 'getting SOL price');

    // Use last known price if available, otherwise use a reasonable estimate
    if (lastKnownSolPrice !== null && lastKnownSolPrice > 0) {
      console.log('Using last known SOL price:', lastKnownSolPrice);
      return lastKnownSolPrice;
    }

    // If we've never successfully fetched a price, use a reasonable estimate
    return 100; // Fallback to estimated price to prevent UI issues
  }
};

/**
 * Get token 24h price change
 */
// Store the last successfully fetched 24h changes
const lastKnown24hChanges: Record<string, number> = {};

export const getToken24hChange = async (tokenSymbol: string): Promise<number> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls['getToken24hChange'] = (apiUsageStats.apiCalls['getToken24hChange'] || 0) + 1;

    const change = await getCachedOrFetch(`${tokenSymbol}_24h_change`, async () => {
      const response = await fetchWithTimeout(`${JUPITER_API_BASE}/price?ids=${tokenSymbol}`, {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const priceChange = data?.data?.[tokenSymbol]?.priceChange24h || 0;

      // Store the successfully fetched change for future fallbacks
      lastKnown24hChanges[tokenSymbol] = priceChange;

      return priceChange;
    });

    return change;
  } catch (error) {
    handleApiError(error, `getting ${tokenSymbol} 24h change`);

    // Use last known change if available
    if (lastKnown24hChanges[tokenSymbol] !== undefined) {
      console.log(`Using last known ${tokenSymbol} 24h change:`, lastKnown24hChanges[tokenSymbol]);
      return lastKnown24hChanges[tokenSymbol];
    }

    return 0; // Default to 0% change if no data is available
  }
};

/**
 * Get token prices for multiple tokens
 */
export const getTokenPrices = async (tokenAddresses: string[]): Promise<Record<string, number>> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls['getTokenPrices'] = (apiUsageStats.apiCalls['getTokenPrices'] || 0) + 1;

    if (!tokenAddresses || tokenAddresses.length === 0) {
      return {};
    }

    const cacheKey = `token_prices_${tokenAddresses.join('_')}`;

    return await getCachedOrFetch(cacheKey, async () => {
      const addresses = tokenAddresses.join(',');
      const response = await fetchWithTimeout(`${JUPITER_API_BASE}/price?ids=${addresses}`, {
        timeout: 8000
      });

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.statusText}`);
      }

      const data = await response.json();

      const prices: Record<string, number> = {};
      if (data?.data) {
        for (const address of tokenAddresses) {
          prices[address] = data.data[address]?.price || 0;
        }
      }

      return prices;
    });
  } catch (error) {
    handleApiError(error, 'getting token prices');

    // Return empty object with 0 prices for all requested tokens
    const fallbackPrices: Record<string, number> = {};
    tokenAddresses.forEach(address => {
      fallbackPrices[address] = 0;
    });

    return fallbackPrices;
  }
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: any, context: string): void => {
  console.error(`API Error (${context}):`, error);

  // Determine if it's a rate limit error
  const isRateLimit = error?.response?.status === 429 ||
                      error?.message?.includes('rate limit') ||
                      error?.message?.includes('too many requests');

  // Determine if it's a timeout
  const isTimeout = error?.name === 'AbortError' ||
                    error?.message?.includes('timeout') ||
                    error?.message?.includes('aborted');

  // Only show toast for rate limit errors or timeouts (not connection failures)
  if (isRateLimit || isTimeout) {
    const toastMessage = isRateLimit
      ? `Rate limit reached for ${context}. Please try again later.`
      : `Request timeout for ${context}. Network may be slow.`;

    toast({
      title: isRateLimit ? "API Rate Limit Exceeded" : "API Request Timeout",
      description: toastMessage,
      variant: "destructive",
    });
  }
};

/**
 * Cleanup expired cache entries
 */
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, { timestamp }] of apiCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      apiCache.delete(key);
    }
  }
};

// Run cache cleanup periodically
setInterval(cleanupCache, 300000); // Clean up every 5 minutes
