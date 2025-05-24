/**
 * Secure API service that communicates with the backend proxy
 * This service replaces direct API calls with exposed API keys
 */

import { fetchApi, showApiErrorToast } from './apiService';

// API base URL - should be configured based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api';

/**
 * Get the authentication token from localStorage
 * For wallet-based authentication, we use the user object
 */
const getAuthToken = (): string | null => {
  // First try to get the authToken directly
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    return authToken;
  }

  // If no authToken, check if we have a user object from wallet authentication
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Use the wallet address as the token for wallet-based authentication
      if (user && user.wallet_address) {
        return user.wallet_address;
      }
    } catch (e) {
      console.error("Failed to parse user data:", e);
    }
  }

  return null;
};

/**
 * Create headers with authentication token
 */
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Make a Helius RPC call through the backend proxy
 */
export const heliusRpcCall = async (method: string, params: any[] = []): Promise<any> => {
  try {
    const response = await fetchApi<any>(`${API_BASE_URL}/helius/rpc`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        method,
        params
      }),
      cacheConfig: {
        enabled: true,
        ttl: 60000 // 1 minute cache
      }
    });

    return response.result;
  } catch (error) {
    showApiErrorToast(error, `Helius RPC call (${method})`);
    throw error;
  }
};

/**
 * Make a Helius API call through the backend proxy
 */
export const heliusApiCall = async (endpoint: string, data: any = {}): Promise<any> => {
  try {
    return await fetchApi<any>(`${API_BASE_URL}/helius/${endpoint}`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify(data),
      cacheConfig: {
        enabled: true,
        ttl: 60000 // 1 minute cache
      }
    });
  } catch (error) {
    showApiErrorToast(error, `Helius API call (${endpoint})`);
    throw error;
  }
};

/**
 * Get SOL price through the backend proxy
 */
export const getSolPrice = async (): Promise<number> => {
  try {
    const response = await fetchApi<any>(`${API_BASE_URL}/jupiter/price?ids=SOL`, {
      method: 'GET',
      headers: createAuthHeaders(),
      cacheConfig: {
        enabled: true,
        ttl: 60000 // 1 minute cache
      }
    });

    return response?.data?.SOL?.price || 0;
  } catch (error) {
    showApiErrorToast(error, 'getting SOL price');
    return 100; // Fallback to estimated price to prevent UI issues
  }
};

/**
 * Get token 24h price change through the backend proxy
 */
export const getToken24hChange = async (tokenSymbol: string): Promise<number> => {
  try {
    const response = await fetchApi<any>(`${API_BASE_URL}/jupiter/price?ids=${tokenSymbol}`, {
      method: 'GET',
      headers: createAuthHeaders(),
      cacheConfig: {
        enabled: true,
        ttl: 60000 // 1 minute cache
      }
    });

    return response?.data?.[tokenSymbol]?.priceChange24h || 0;
  } catch (error) {
    showApiErrorToast(error, `getting ${tokenSymbol} 24h change`);
    return 0;
  }
};

/**
 * Get token prices for multiple tokens through the backend proxy
 */
export const getTokenPrices = async (tokenAddresses: string[]): Promise<Record<string, number>> => {
  try {
    if (!tokenAddresses || tokenAddresses.length === 0) {
      return {};
    }

    const addresses = tokenAddresses.join(',');
    const response = await fetchApi<any>(`${API_BASE_URL}/jupiter/price?ids=${addresses}`, {
      method: 'GET',
      headers: createAuthHeaders(),
      cacheConfig: {
        enabled: true,
        ttl: 60000 // 1 minute cache
      }
    });

    const prices: Record<string, number> = {};
    if (response?.data) {
      for (const address of tokenAddresses) {
        prices[address] = response.data[address]?.price || 0;
      }
    }

    return prices;
  } catch (error) {
    showApiErrorToast(error, 'getting token prices');

    // Return empty object with 0 prices for all requested tokens
    const fallbackPrices: Record<string, number> = {};
    tokenAddresses.forEach(address => {
      fallbackPrices[address] = 0;
    });

    return fallbackPrices;
  }
};

/**
 * Test connection to Helius API through the backend proxy
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const response = await fetchApi<any>(`${API_BASE_URL}/helius/test-connection`, {
      method: 'GET',
      headers: createAuthHeaders(),
      cacheConfig: {
        enabled: false // Don't cache connection tests
      }
    });

    return response.connected;
  } catch (error) {
    console.error("Helius API connection failed:", error);
    return false;
  }
};

/**
 * Get API usage statistics through the backend proxy
 */
export const getApiUsageStats = async (): Promise<any> => {
  try {
    return await fetchApi<any>(`${API_BASE_URL}/helius/usage-stats`, {
      method: 'GET',
      headers: createAuthHeaders(),
      cacheConfig: {
        enabled: true,
        ttl: 300000 // 5 minute cache
      }
    });
  } catch (error) {
    console.error("Failed to get API usage stats:", error);

    // Return mock data if API call fails
    return {
      dailyRequests: Math.floor(Math.random() * 500) + 100,
      apiCalls: {
        getTokenInfo: Math.floor(Math.random() * 50),
        getTransaction: Math.floor(Math.random() * 30),
      },
      requestsPerEndpoint: {
        transactions: Math.floor(Math.random() * 50),
        tokenMetadata: Math.floor(Math.random() * 30),
      }
    };
  }
};

// Export the secureApiService object with all the functions
export const secureApiService = {
  getAuthToken,
  createAuthHeaders,
  heliusRpcCall,
  heliusApiCall,
  getSolPrice,
  getToken24hChange,
  getTokenPrices,
  testHeliusConnection,
  getApiUsageStats
};
