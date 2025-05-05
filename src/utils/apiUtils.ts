import { toast } from "@/hooks/use-toast";

// API keys (should be moved to environment variables in production)
export const HELIUS_API_KEY = "a18d2c93-d9fa-4db2-8419-707a4f1782f7";
export const BIRDEYE_API_KEY = "67f79318c29e4eda99c3184c2ac65116";
export const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZlMjk1MDllLWQ0YWMtNDI0YS1hMDg4LTBhZTgwNTdkNzgyNyIsIm9yZ0lkIjoiNDQzOTg4IiwidXNlcklkIjoiNDU2ODA3IiwidHlwZUlkIjoiZGYxNjU0MWYtNTJhNy00MGFiLWFiN2EtODYxZTliYmZiN2U4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDU2ODIzODUsImV4cCI6NDkwMTQ0MjM4NX0.eAg55zBFSaFEnnuKA_EmP-u-61Hkb6YqM8v1YhWduAo";

// API endpoints
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_API_BASE = "https://api.helius.xyz/v0";
export const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

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
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-connection-test',
        method: 'getHealth',
      }),
    });
    
    const data = await response.json();
    return data.result === "ok" || data.result === 1;
  } catch (error) {
    console.error("Helius API connection failed:", error);
    return false;
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

    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `helius-${Date.now()}`,
        method,
        params,
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius API error: ${data.error.message}`);
    }
    
    return data.result;
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
    
    const url = `${HELIUS_API_BASE}/${endpoint}?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.statusText}`);
    }
    
    return await response.json();
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
  // For now, return mocked usage stats
  return {
    dailyRequests: Math.floor(Math.random() * 500) + 100,
    apiCalls: {
      getTokenInfo: Math.floor(Math.random() * 200),
      getTransaction: Math.floor(Math.random() * 150),
      getSignaturesForAddress: Math.floor(Math.random() * 100),
    },
    requestsPerEndpoint: {
      transactions: Math.floor(Math.random() * 200),
      tokenMetadata: Math.floor(Math.random() * 150),
    }
  };
};

/**
 * Get SOL price
 */
export const getSolPrice = async (): Promise<number> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls['getSolPrice'] = (apiUsageStats.apiCalls['getSolPrice'] || 0) + 1;
    
    const response = await fetch('https://price.jup.ag/v4/price?ids=SOL');
    const data = await response.json();
    return data?.data?.SOL?.price || 0;
  } catch (error) {
    handleApiError(error, 'getting SOL price');
    return 0;
  }
};

/**
 * Get token 24h price change
 */
export const getToken24hChange = async (tokenSymbol: string): Promise<number> => {
  try {
    // Track API usage
    apiUsageStats.dailyRequests++;
    apiUsageStats.apiCalls['getToken24hChange'] = (apiUsageStats.apiCalls['getToken24hChange'] || 0) + 1;
    
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${tokenSymbol}`);
    const data = await response.json();
    return data?.data?.[tokenSymbol]?.priceChange24h || 0;
  } catch (error) {
    handleApiError(error, `getting ${tokenSymbol} 24h change`);
    return 0;
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
    
    const addresses = tokenAddresses.join(',');
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${addresses}`);
    const data = await response.json();
    
    const prices: Record<string, number> = {};
    if (data?.data) {
      for (const address of tokenAddresses) {
        prices[address] = data.data[address]?.price || 0;
      }
    }
    
    return prices;
  } catch (error) {
    handleApiError(error, 'getting token prices');
    return {};
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
  
  // Show appropriate toast
  if (isRateLimit) {
    toast({
      title: "API Rate Limit Exceeded",
      description: `Rate limit reached for ${context}. Please try again later.`,
      variant: "destructive",
    });
  } else {
    toast({
      title: "API Request Failed",
      description: `Failed to ${context}. ${error.message || 'Please try again.'}`,
      variant: "destructive",
    });
  }
};
