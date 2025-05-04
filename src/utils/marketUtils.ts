
import { heliusApiCall } from "./apiUtils";

/**
 * Fetches token price data
 * @param symbol Token symbol
 * @param timeframe Timeframe for data (1h, 1d, 1w, 1m)
 * @param chain Blockchain to fetch data for
 * @returns Price and volume data for the requested timeframe
 */
export const fetchTokenPriceData = async (
  symbol: string, 
  timeframe: string, 
  chain: "solana" | "binance"
): Promise<any[]> => {
  try {
    if (chain === "solana") {
      // Use Helius API to fetch historical price data
      const endpoint = `/token-price-history/${symbol}?timeframe=${timeframe}`;
      const response = await heliusApiCall<any>(endpoint);
      return response?.data || [];
    } else {
      // For non-Solana tokens, we'd use a different API 
      // This is a placeholder for future implementation
      console.warn("Non-Solana token price data fetch not fully implemented");
      return [];
    }
  } catch (error) {
    console.error(`Error fetching token price data for ${symbol}:`, error);
    return [];
  }
};

/**
 * Gets market overview for multiple tokens
 * @param chain Blockchain to fetch data for
 * @param limit Maximum number of tokens to return
 * @returns Top tokens by market cap with price data
 */
export const getMarketOverview = async (
  chain: "solana" | "binance" | "all",
  limit = 10
): Promise<any[]> => {
  try {
    if (chain === "solana" || chain === "all") {
      // Use Helius API to fetch top tokens
      const response = await heliusApiCall<any>('/token-market-data');
      
      // Process response data
      if (response && response.tokens) {
        const tokens = response.tokens
          .map((token: any) => ({
            id: token.address || token.symbol.toLowerCase(),
            name: token.name,
            symbol: token.symbol,
            price: parseFloat(token.price) || 0,
            change24h: parseFloat(token.change24h) || 0,
            volume24h: parseFloat(token.volume24h) || 0,
            marketCap: parseFloat(token.marketCap) || 0,
            chain: "solana"
          }))
          .filter((token: any) => token.marketCap > 0)
          .sort((a: any, b: any) => b.marketCap - a.marketCap)
          .slice(0, limit);
          
        return tokens;
      }
    }
    
    if (chain === "binance" || chain === "all") {
      // For Binance tokens, we would implement a different API call
      // This is not implemented in this version
      console.warn("Binance market data fetch not implemented");
    }
    
    // If no data is returned from real APIs, return empty array
    return [];
  } catch (error) {
    console.error("Error fetching market overview:", error);
    
    // Return empty result on error
    return [];
  }
};

/**
 * Fetches recently active tokens with high volume
 * @param chain Blockchain to fetch data for
 * @param timeframe Timeframe to analyze (1h, 24h, 7d)
 * @returns Tokens with high activity in the given timeframe
 */
export const getHighActivityTokens = async (
  chain: "solana" | "binance" | "all",
  timeframe: "1h" | "24h" | "7d" = "24h"
): Promise<any[]> => {
  try {
    if (chain === "solana" || chain === "all") {
      // Use Helius API to fetch high activity tokens
      const response = await heliusApiCall<any>(`/token-activity?timeframe=${timeframe}`);
      
      if (response && response.tokens) {
        return response.tokens.map((token: any) => ({
          id: token.address || token.symbol.toLowerCase(),
          name: token.name,
          symbol: token.symbol,
          chain: "solana",
          price: parseFloat(token.price) || 0,
          priceChange: parseFloat(token.priceChange) || 0,
          volumeChange: parseFloat(token.volumeChange) || 0,
          volume: parseFloat(token.volume) || 0,
          liquidityChange: parseFloat(token.liquidityChange) || 0,
          activityScore: parseFloat(token.activityScore) || 0
        }));
      }
    }
    
    if (chain === "binance" || chain === "all") {
      // For Binance tokens, we would implement a different API call
      // This is not implemented in this version
      console.warn("Binance activity data fetch not implemented");
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching high activity tokens:", error);
    return [];
  }
};

/**
 * Analyzes token sentiment based on social media and on-chain metrics
 * @param symbol Token symbol
 * @param chain Blockchain the token is on
 * @returns Sentiment analysis data
 */
export const analyzeTokenSentiment = async (
  symbol: string,
  chain: "solana" | "binance"
): Promise<any> => {
  try {
    if (chain === "solana") {
      // Use Helius API to fetch token sentiment
      const response = await heliusApiCall<any>(`/token-sentiment/${symbol}`);
      return response?.sentiment || {};
    } else {
      // For non-Solana tokens, we'd use a different API
      // This is a placeholder for future implementation
      console.warn("Non-Solana token sentiment analysis not implemented");
      return {};
    }
  } catch (error) {
    console.error(`Error analyzing token sentiment for ${symbol}:`, error);
    return {};
  }
};
