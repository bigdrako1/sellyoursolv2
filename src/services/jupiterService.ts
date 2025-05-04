
import { APP_CONFIG } from '@/config/appDefinition';
import { waitForRateLimit } from '@/utils/rateLimit';

/**
 * Jupiter Swap Service
 * Handles interactions with Jupiter aggregator for swaps and price discovery
 */

// Price cache to reduce API calls
const priceCache: Record<string, { price: number; timestamp: number }> = {};
const PRICE_CACHE_EXPIRY = 60000; // 1 minute

/**
 * Get token price from Jupiter
 * @param tokenMint Token mint address
 * @returns Token price in USD
 */
export const getTokenPrice = async (tokenMint: string): Promise<number | null> => {
  try {
    // Check cache first
    if (priceCache[tokenMint] && (Date.now() - priceCache[tokenMint].timestamp) < PRICE_CACHE_EXPIRY) {
      return priceCache[tokenMint].price;
    }
    
    await waitForRateLimit('jupiterApi');
    
    const response = await fetch(`${APP_CONFIG.jupiter.priceApiUrl}/price?ids=${tokenMint}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data?.data?.[tokenMint]?.price) {
      const price = data.data[tokenMint].price;
      
      // Store in cache
      priceCache[tokenMint] = {
        price,
        timestamp: Date.now()
      };
      
      return price;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting price for ${tokenMint}:`, error);
    return null;
  }
};

/**
 * Get multiple token prices from Jupiter
 * @param tokenMints Array of token mint addresses
 * @returns Object mapping token mints to prices
 */
export const getTokenPrices = async (tokenMints: string[]): Promise<Record<string, number>> => {
  try {
    if (!tokenMints.length) return {};
    
    // Filter out tokens that are already in cache
    const tokensToFetch = tokenMints.filter(mint => 
      !priceCache[mint] || (Date.now() - priceCache[mint].timestamp) >= PRICE_CACHE_EXPIRY
    );
    
    const result: Record<string, number> = {};
    
    // Return cached prices for tokens that are in cache
    tokenMints.forEach(mint => {
      if (priceCache[mint] && (Date.now() - priceCache[mint].timestamp) < PRICE_CACHE_EXPIRY) {
        result[mint] = priceCache[mint].price;
      }
    });
    
    // If all tokens are in cache, return result
    if (!tokensToFetch.length) return result;
    
    await waitForRateLimit('jupiterApi');
    
    // Fetch prices for tokens not in cache
    const response = await fetch(`${APP_CONFIG.jupiter.priceApiUrl}/price?ids=${tokensToFetch.join(',')}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update result and cache
    if (data?.data) {
      tokensToFetch.forEach(mint => {
        if (data.data[mint]?.price) {
          const price = data.data[mint].price;
          result[mint] = price;
          
          // Store in cache
          priceCache[mint] = {
            price,
            timestamp: Date.now()
          };
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Error getting prices for multiple tokens:`, error);
    return {};
  }
};

/**
 * Get quote for swap
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param amount Amount of input token (in lamports/smallest denomination)
 * @returns Quote information
 */
export const getSwapQuote = async (inputMint: string, outputMint: string, amount: number): Promise<any> => {
  try {
    await waitForRateLimit('jupiterApi');
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: (APP_CONFIG.jupiter.defaultSlippage * 100).toString(),
    });
    
    const response = await fetch(`${APP_CONFIG.jupiter.apiUrl}/quote?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error getting swap quote:`, error);
    return null;
  }
};

/**
 * Generate Jupiter swap URL
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @returns URL for Jupiter swap interface
 */
export const generateJupiterSwapUrl = (inputMint: string, outputMint: string, exactIn?: boolean): string => {
  if (exactIn) {
    return `${APP_CONFIG.jupiter.swapUrl}/SOL-${outputMint}?inAmount=0.1`;
  }
  return `${APP_CONFIG.jupiter.swapUrl}/SOL-${outputMint}`;
};

/**
 * Clean up expired cache entries
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  Object.keys(priceCache).forEach(key => {
    if (now - priceCache[key].timestamp > PRICE_CACHE_EXPIRY) {
      delete priceCache[key];
    }
  });
};

// Periodically clean up the cache
setInterval(cleanupCache, 300000); // Clean every 5 minutes
