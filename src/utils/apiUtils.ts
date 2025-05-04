
/**
 * API utilities for Helius API integration
 */

// Helius API configuration
const HELIUS_API_KEY = "a18d2c93-d9fa-4db2-8419-707a4f1782f7";
const HELIUS_BASE_URL = "https://api.helius.xyz/v1";  // Updated to v1 from v0
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com";
const HELIUS_WEBSOCKET_URL = "wss://mainnet.helius-rpc.com";

// Rate limiting configuration
const RATE_LIMIT = 5; // requests per second
const RATE_WINDOW = 1000; // 1 second in milliseconds
const BURST_LIMIT = 10; // maximum burst requests

// Tracking state
interface ApiUsageStats {
  totalCalls: number;
  dailyCalls: Record<string, number>;
  methodCalls: Record<string, number>;
  rateExceeded: number;
  lastReset: number;
}

// Initialize usage stats
const usageStats: ApiUsageStats = {
  totalCalls: 0,
  dailyCalls: {},
  methodCalls: {},
  rateExceeded: 0,
  lastReset: Date.now(),
};

// Reset daily calls at midnight
const resetDailyCalls = () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (!usageStats.dailyCalls[today]) {
    usageStats.dailyCalls[today] = 0;
  }
};

// Token bucket for rate limiting
let tokens = BURST_LIMIT;
let lastRefill = Date.now();

// Refill tokens based on rate limit
const refillTokens = () => {
  const now = Date.now();
  const timePassed = now - lastRefill;
  const newTokens = Math.floor(timePassed / RATE_WINDOW) * RATE_LIMIT;
  tokens = Math.min(BURST_LIMIT, tokens + newTokens);
  lastRefill = now - (timePassed % RATE_WINDOW);
  return tokens > 0;
};

// Track API usage
const trackApiCall = (method: string) => {
  usageStats.totalCalls++;
  
  // Track by date
  resetDailyCalls();
  const today = new Date().toISOString().split('T')[0];
  usageStats.dailyCalls[today] = (usageStats.dailyCalls[today] || 0) + 1;
  
  // Track by method
  usageStats.methodCalls[method] = (usageStats.methodCalls[method] || 0) + 1;
};

// Check if we can make an API call based on rate limiting
const canMakeApiCall = (): boolean => {
  refillTokens();
  if (tokens > 0) {
    tokens--;
    return true;
  }
  usageStats.rateExceeded++;
  return false;
};

// Get Helius API usage statistics
export const getApiUsageStats = (): ApiUsageStats => {
  return { ...usageStats };
};

// Make an API call to Helius with rate limiting
export const heliusApiCall = async <T>(
  endpoint: string,
  method = 'GET',
  body?: any
): Promise<T> => {
  if (!canMakeApiCall()) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  
  trackApiCall(endpoint);
  
  const url = `${HELIUS_BASE_URL}${endpoint}?api-key=${HELIUS_API_KEY}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error("Helius API call failed:", error);
    throw error;
  }
};

// Make an RPC call to Helius
export const heliusRpcCall = async <T>(method: string, params: any[] = []): Promise<T> => {
  if (!canMakeApiCall()) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }
  
  trackApiCall(method);
  
  const rpcRequest = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params
  };
  
  const url = `${HELIUS_RPC_URL}/?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest)
    });
    
    if (!response.ok) {
      throw new Error(`Helius RPC error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`Helius RPC error: ${data.error.message}`);
    }
    
    return data.result;
  } catch (error) {
    console.error("Helius RPC call failed:", error);
    throw error;
  }
};

// Test Helius API connection
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    // Use getBalances as a test endpoint - more reliable than health-check
    const rpcResult = await heliusRpcCall<any>("getHealth", []);
    return rpcResult ? true : false;
  } catch (error) {
    console.error("Failed to connect to Helius API:", error);
    return false;
  }
};

// Get token prices from Helius API
export const getTokenPrices = async (tokenMints: string[]): Promise<any> => {
  try {
    return await heliusRpcCall<any>("getTokenPrices", [tokenMints]);
  } catch (error) {
    console.error("Failed to get token prices:", error);
    throw error;
  }
};

// Create a new webhook
export interface WebhookConfig {
  webhook_url: string; // The URL that will receive webhook events
  transaction_types: string[]; // Types of transactions to listen for
  account_addresses: string[]; // Addresses to monitor
  webhook_type: "enhanced" | "raw"; // Enhanced includes parsed data
  auth_header?: string; // Optional authorization header
  discord?: {
    username?: string;
    avatar_url?: string;
  };
}

export const createWebhook = async (config: WebhookConfig): Promise<{ webhook_id: string }> => {
  try {
    return await heliusApiCall<{ webhook_id: string }>('/webhooks', 'POST', config);
  } catch (error) {
    console.error("Failed to create webhook:", error);
    throw error;
  }
};

// Get all webhooks
export const getWebhooks = async (): Promise<any[]> => {
  try {
    return await heliusApiCall<any[]>('/webhooks');
  } catch (error) {
    console.error("Failed to get webhooks:", error);
    throw error;
  }
};

// Delete a webhook
export const deleteWebhook = async (webhookId: string): Promise<boolean> => {
  try {
    await heliusApiCall<void>(`/webhooks/${webhookId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error(`Failed to delete webhook ${webhookId}:`, error);
    return false;
  }
};

// Parse transaction data
export const parseTransaction = async (signatures: string[]): Promise<any[]> => {
  try {
    return await heliusApiCall<any[]>('/transactions', 'POST', { transactions: signatures });
  } catch (error) {
    console.error("Failed to parse transactions:", error);
    throw error;
  }
};

// Get transaction history for an address
export const getAddressHistory = async (address: string, options: {
  before?: string;
  until?: string;
  limit?: number;
} = {}): Promise<any[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (options.before) queryParams.append('before', options.before);
    if (options.until) queryParams.append('until', options.until);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    
    const endpoint = `/addresses/${address}/transactions?${queryParams.toString()}`;
    return await heliusApiCall<any[]>(endpoint);
  } catch (error) {
    console.error(`Failed to get transaction history for ${address}:`, error);
    throw error;
  }
};
