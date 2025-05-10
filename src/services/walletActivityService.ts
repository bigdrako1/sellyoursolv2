import { WalletActivity } from "@/types/token.types";
import { trackWalletActivities } from "./tokenDataService";

// Cache for wallet activities
const activityCache = new Map<string, {
  activities: WalletActivity[];
  timestamp: number;
}>();

const CACHE_TTL = 60000; // 1 minute cache

export async function getWalletActivities(walletAddresses: string[]): Promise<WalletActivity[]> {
  // Create a cache key from the wallet addresses
  const cacheKey = walletAddresses.sort().join(',');
  const cached = activityCache.get(cacheKey);
  
  // Return cached data if it's fresh
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.activities;
  }
  
  // Otherwise fetch fresh data
  try {
    const activities = await trackWalletActivities(walletAddresses);
    
    // Cache the results
    activityCache.set(cacheKey, {
      activities,
      timestamp: Date.now()
    });
    
    return activities;
  } catch (error) {
    console.error('Error fetching wallet activities:', error);
    return [];
  }
}

export function clearActivityCache() {
  activityCache.clear();
}
