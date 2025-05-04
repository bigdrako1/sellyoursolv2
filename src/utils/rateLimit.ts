
/**
 * Utility functions for API rate limiting
 * Based on Helius API pricing and rate limits: https://docs.helius.dev/welcome/pricing-and-rate-limits
 */

// Define rate limits for different API tiers
export enum RateLimitTier {
  FREE = 'FREE',
  STARTER = 'STARTER',
  GROWTH = 'GROWTH',
  SCALE = 'SCALE'
}

interface RateLimits {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerDay: number;
}

// Rate limits based on Helius pricing tiers
const RATE_LIMITS: Record<RateLimitTier, RateLimits> = {
  [RateLimitTier.FREE]: {
    requestsPerSecond: 10,
    requestsPerMinute: 100,
    requestsPerDay: 10000
  },
  [RateLimitTier.STARTER]: {
    requestsPerSecond: 25,
    requestsPerMinute: 250,
    requestsPerDay: 100000
  },
  [RateLimitTier.GROWTH]: {
    requestsPerSecond: 50,
    requestsPerMinute: 500,
    requestsPerDay: 500000
  },
  [RateLimitTier.SCALE]: {
    requestsPerSecond: 100,
    requestsPerMinute: 1000,
    requestsPerDay: 1000000
  }
};

// Tracking for API calls
interface RateLimitTracker {
  calls: { timestamp: number }[];
  currentTier: RateLimitTier;
}

// Store for different API endpoints
const rateLimitTrackers: Record<string, RateLimitTracker> = {
  heliusRpc: {
    calls: [],
    currentTier: RateLimitTier.FREE
  },
  heliusApi: {
    calls: [],
    currentTier: RateLimitTier.FREE
  }
};

/**
 * Set the rate limit tier for a specific API
 * @param api API identifier
 * @param tier Tier to set
 */
export const setRateLimitTier = (api: string, tier: RateLimitTier): void => {
  if (rateLimitTrackers[api]) {
    rateLimitTrackers[api].currentTier = tier;
  } else {
    rateLimitTrackers[api] = {
      calls: [],
      currentTier: tier
    };
  }
};

/**
 * Check if a request can be made or if it would exceed the rate limit
 * @param api API identifier
 * @returns Whether the request can proceed
 */
export const canMakeRequest = (api: string): boolean => {
  const tracker = rateLimitTrackers[api];
  
  if (!tracker) {
    return true; // No tracker for this API, allow by default
  }
  
  const now = Date.now();
  const limits = RATE_LIMITS[tracker.currentTier];
  
  // Clean up old calls
  tracker.calls = tracker.calls.filter(call => now - call.timestamp < 86400000); // 24 hours
  
  // Check rate limits
  const callsLastSecond = tracker.calls.filter(call => now - call.timestamp < 1000).length;
  const callsLastMinute = tracker.calls.filter(call => now - call.timestamp < 60000).length;
  const callsToday = tracker.calls.length;
  
  return (
    callsLastSecond < limits.requestsPerSecond &&
    callsLastMinute < limits.requestsPerMinute &&
    callsToday < limits.requestsPerDay
  );
};

/**
 * Track a request that was made to an API
 * @param api API identifier
 */
export const trackRequest = (api: string): void => {
  const tracker = rateLimitTrackers[api];
  
  if (!tracker) {
    rateLimitTrackers[api] = {
      calls: [{ timestamp: Date.now() }],
      currentTier: RateLimitTier.FREE
    };
    return;
  }
  
  tracker.calls.push({ timestamp: Date.now() });
};

/**
 * Get the current usage statistics for an API
 * @param api API identifier
 * @returns Usage statistics
 */
export const getUsageStatistics = (api: string) => {
  const tracker = rateLimitTrackers[api];
  
  if (!tracker) {
    return {
      tier: RateLimitTier.FREE,
      usagePerSecond: 0,
      usagePerMinute: 0,
      usagePerDay: 0,
      limitsPerSecond: RATE_LIMITS[RateLimitTier.FREE].requestsPerSecond,
      limitsPerMinute: RATE_LIMITS[RateLimitTier.FREE].requestsPerMinute,
      limitsPerDay: RATE_LIMITS[RateLimitTier.FREE].requestsPerDay
    };
  }
  
  const now = Date.now();
  const limits = RATE_LIMITS[tracker.currentTier];
  
  return {
    tier: tracker.currentTier,
    usagePerSecond: tracker.calls.filter(call => now - call.timestamp < 1000).length,
    usagePerMinute: tracker.calls.filter(call => now - call.timestamp < 60000).length,
    usagePerDay: tracker.calls.filter(call => now - call.timestamp < 86400000).length,
    limitsPerSecond: limits.requestsPerSecond,
    limitsPerMinute: limits.requestsPerMinute,
    limitsPerDay: limits.requestsPerDay
  };
};

/**
 * Wait until a request can be made if rate limited
 * @param api API identifier
 * @returns Promise that resolves when request can proceed
 */
export const waitForRateLimit = async (api: string): Promise<void> => {
  if (canMakeRequest(api)) {
    trackRequest(api);
    return;
  }
  
  // Wait and try again
  return new Promise(resolve => {
    setTimeout(() => {
      waitForRateLimit(api).then(resolve);
    }, 1000);
  });
};

/**
 * Create a rate limiter function for a specific number of requests per minute
 * @param requestsPerMinute Maximum requests per minute
 * @returns Function that when called will delay if needed to respect rate limits
 */
export const rateLimit = (requestsPerMinute: number) => {
  const calls: number[] = [];
  const periodMs = 60000; // 1 minute in milliseconds
  
  return async (): Promise<void> => {
    const now = Date.now();
    
    // Remove timestamps older than our period
    while (calls.length > 0 && calls[0] < now - periodMs) {
      calls.shift();
    }
    
    // If we've reached our limit, wait
    if (calls.length >= requestsPerMinute) {
      const oldestCall = calls[0];
      const msToWait = oldestCall + periodMs - now;
      
      // Wait until we can make another call
      await new Promise(resolve => setTimeout(resolve, msToWait));
    }
    
    // Add current timestamp to calls
    calls.push(Date.now());
  };
};

// Export default tier for app initialization
export const DEFAULT_TIER = RateLimitTier.FREE;
