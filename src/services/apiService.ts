
/**
 * Standardized API service with caching capabilities
 */

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
