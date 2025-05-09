
/**
 * Standardized API service with caching capabilities
 */

import { toast } from "@/hooks/use-toast";

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
}

interface RequestConfig extends RequestInit {
  cacheConfig?: CacheConfig;
  retries?: number;
  retryDelay?: number;
}

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  enabled: true,
  ttl: 60000 // 1 minute
};

// Memory cache for API responses
const apiCache: Map<string, CacheItem<any>> = new Map();

/**
 * Check if cache item is expired
 * @param item Cache item to check
 * @returns True if expired, false otherwise
 */
const isCacheExpired = <T>(item: CacheItem<T>): boolean => {
  return Date.now() > item.expiresAt;
};

/**
 * Generate cache key from URL and parameters
 * @param url API URL
 * @param params Optional parameters
 * @returns Cache key string
 */
const generateCacheKey = (url: string, params?: Record<string, any>): string => {
  if (!params) return url;
  return `${url}:${JSON.stringify(params)}`;
};

/**
 * Clean expired cache items
 */
const cleanCache = (): void => {
  for (const [key, item] of apiCache.entries()) {
    if (isCacheExpired(item)) {
      apiCache.delete(key);
    }
  }
};

// Clean cache every 5 minutes
setInterval(cleanCache, 5 * 60 * 1000);

/**
 * Fetch API with caching, retries, and error handling
 * @param url API URL to fetch
 * @param config Request configuration
 * @returns Promise with response data
 */
export const fetchApi = async <T>(url: string, config?: RequestConfig): Promise<T> => {
  const {
    cacheConfig = DEFAULT_CACHE_CONFIG,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = config || {};

  // Generate cache key
  const cacheKey = generateCacheKey(url, fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined);

  // Check cache if enabled
  if (cacheConfig.enabled) {
    const cachedItem = apiCache.get(cacheKey);
    if (cachedItem && !isCacheExpired(cachedItem)) {
      return cachedItem.data;
    }
  }

  // Helper function for retries
  const fetchWithRetry = async (retriesLeft: number): Promise<T> => {
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache response if caching is enabled
      if (cacheConfig.enabled) {
        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + cacheConfig.ttl
        });
      }
      
      return data;
    } catch (error) {
      if (retriesLeft > 0) {
        console.log(`Retrying fetch to ${url}, ${retriesLeft} attempts left`);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchWithRetry(retriesLeft - 1);
      }
      throw error;
    }
  };

  return fetchWithRetry(retries);
};

/**
 * Show toast notification for API errors
 * @param error Error object
 * @param context Error context
 */
export const showApiErrorToast = (error: any, context: string): void => {
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
 * Clear API cache for specific URL or all cache if URL not provided
 * @param url Optional URL to clear cache for
 */
export const clearCache = (url?: string): void => {
  if (url) {
    // Clear cache for specific URL
    for (const key of apiCache.keys()) {
      if (key.startsWith(url)) {
        apiCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    apiCache.clear();
  }
};

/**
 * Mock data when API calls fail
 */
export const getMockTokenData = (symbols: string[] = ['SOL']) => {
  return symbols.reduce((acc, symbol) => {
    acc[symbol] = {
      price: symbol === 'SOL' ? 100.00 : Math.random() * 10,
      priceChange24h: (Math.random() * 20) - 10, // -10% to +10%
      volume: Math.random() * 1000000,
      marketCap: Math.random() * 10000000
    };
    return acc;
  }, {} as Record<string, any>);
};

// Export a test function that can be called to verify API connectivity
export const testApiConnectivity = async (url: string): Promise<boolean> => {
  try {
    await fetch(url, { 
      method: 'HEAD', 
      timeout: 5000,
      signal: AbortSignal.timeout(5000)
    });
    return true;
  } catch (error) {
    console.error(`Failed to connect to ${url}:`, error);
    return false;
  }
};
