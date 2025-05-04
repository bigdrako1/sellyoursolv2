
/**
 * API utilities for rate limiting and usage tracking
 */

// Helius API configuration
const HELIUS_API_KEY = "a18d2c93-d9fa-4db2-8419-707a4f1782f7";
const HELIUS_BASE_URL = "https://api.helius.xyz/v0";

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

// Test Helius API connection
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    await heliusApiCall('/health-check');
    return true;
  } catch (error) {
    console.error("Failed to connect to Helius API:", error);
    return false;
  }
};
