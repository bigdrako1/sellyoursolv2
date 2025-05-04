
// Trading utilities for autonomous trading platform
import APP_CONFIG, { getActiveApiConfig } from '@/config/appDefinition';

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
 * Get Solana price
 * @returns Current SOL price in USD
 */
export const getSolPrice = async (): Promise<number> => {
  const cacheKey = 'sol_price';
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // In a real app, this would call a price API
    // For now we return a realistic SOL price
    const mockPrice = 150.42;
    
    apiCache.set(cacheKey, {
      data: mockPrice,
      timestamp: Date.now()
    });
    
    return mockPrice;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 150.00; // Fallback price
  }
};

/**
 * Get 24h change percentage for a token
 * @param tokenSymbol Symbol of the token
 * @returns 24h change percentage
 */
export const getToken24hChange = async (tokenSymbol: string): Promise<number> => {
  const cacheKey = `${tokenSymbol}_24h_change`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    // In a real app, this would call a price API
    // For now we return a realistic change percentage
    let changeValue: number;
    
    if (tokenSymbol === 'SOL') {
      changeValue = 4.32;
    } else if (tokenSymbol === 'JTO') {
      changeValue = -1.75;
    } else if (tokenSymbol === 'BONK') {
      changeValue = 8.45;
    } else {
      // Random change for other tokens between -5% and +15%
      changeValue = Math.random() * 20 - 5;
    }
    
    apiCache.set(cacheKey, {
      data: changeValue,
      timestamp: Date.now()
    });
    
    return changeValue;
  } catch (error) {
    console.error(`Error fetching 24h change for ${tokenSymbol}:`, error);
    return 0;
  }
};

/**
 * Gets token prices for specified tokens
 * @param tokens Array of token symbols
 * @returns Object with token prices keyed by symbol
 */
export const getTokenPrices = async (tokens: string[]): Promise<Record<string, number>> => {
  if (!tokens || tokens.length === 0) {
    return {};
  }
  
  try {
    // Using a mock implementation for now
    // In a real app, this would call an API endpoint
    const mockPrices: Record<string, number> = {
      SOL: 150.42,
      JTO: 2.75,
      WIF: 0.89,
      BONK: 0.000022,
    };
    
    const results: Record<string, number> = {};
    
    // Return actual prices for tokens we have, or a random price for unknown tokens
    tokens.forEach(token => {
      if (mockPrices[token]) {
        results[token] = mockPrices[token];
      } else {
        // Generate a realistic random price based on the token name
        // This is just for demo purposes
        const hash = Array.from(token).reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const basePrice = (hash % 1000) / 100;
        results[token] = parseFloat(basePrice.toFixed(6));
      }
    });
    
    return results;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return {};
  }
};

/**
 * Get API usage statistics
 * @returns Object with API usage statistics
 */
export const getApiUsageStats = async (): Promise<{
  dailyRequests: number;
  remainingRequests: number;
  usagePercentage: number;
}> => {
  try {
    // In a real app, this would call the Helius API to get usage statistics
    // For now, we return mock data
    return {
      dailyRequests: 3487,
      remainingRequests: 6513,
      usagePercentage: 34.87
    };
  } catch (error) {
    console.error('Error fetching API usage statistics:', error);
    return {
      dailyRequests: 0,
      remainingRequests: 10000,
      usagePercentage: 0
    };
  }
};

/**
 * Initializes connections to required APIs
 * @returns Status object with connection statuses
 */
export const initApiConnections = async (): Promise<{
  solanaRpc: boolean;
  heliusApi: boolean;
  webhooks: boolean;
}> => {
  try {
    // Test Solana RPC connection
    const rpcConnected = await testHeliusConnection();
    
    // For simplicity, we're assuming Helius API works if RPC works
    // In a real app, we would test this separately
    const heliusApiConnected = rpcConnected;
    
    // For webhooks, we just assume they're configured for now
    // In a real app, we would verify webhook configurations
    const webhooksConnected = true;
    
    return {
      solanaRpc: rpcConnected,
      heliusApi: heliusApiConnected,
      webhooks: webhooksConnected
    };
  } catch (error) {
    console.error("Error initializing API connections:", error);
    return {
      solanaRpc: false,
      heliusApi: false,
      webhooks: false
    };
  }
};
