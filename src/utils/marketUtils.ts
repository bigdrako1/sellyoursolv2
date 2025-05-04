
/**
 * Market utilities for SellYourSOL V2 AI trading platform
 * Functions to interact with market data from Solana ecosystem
 */

import { heliusRpcCall, getTokenPrices } from './apiUtils';

// Common Solana token mints - hardcoded for reliability
const SOLANA_TOKEN_MINTS = {
  "SOL": "So11111111111111111111111111111111111111112",
  "SYS": "SYSaMdwaj1BmJnCzTXaSdT7QF3YwiG8Lk6KCgJ2s1i",
  "RAY": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
  "SRM": "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt",
  "mSOL": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
  "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
};

/**
 * Get market overview data
 * @param limit Number of tokens to return
 * @returns Array of token market data
 */
export const getMarketOverview = async (limit = 5) => {
  try {
    // Get token prices from Jupiter API (more reliable)
    const tokenMints = Object.values(SOLANA_TOKEN_MINTS);
    
    try {
      const mintList = tokenMints.slice(0, limit).join(',');
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintList}`);
      
      if (response.ok) {
        const priceData = await response.json();
        
        if (priceData && priceData.data) {
          const tokenPrices = Object.entries(priceData.data).map(([mint, data]: [string, any]) => {
            // Get token symbol from mint address
            const symbol = Object.keys(SOLANA_TOKEN_MINTS).find(
              key => SOLANA_TOKEN_MINTS[key as keyof typeof SOLANA_TOKEN_MINTS] === mint
            ) || "UNKNOWN";
            
            // Calculate an estimated market cap based on available data
            const estimatedMarketCap = data.price * (data.volume24h / (data.price * 0.05) || 1000000);
            
            return {
              name: data.name || symbol,
              symbol: symbol,
              price: data.price || 0,
              change24h: data.priceChange24h || 0,
              volume24h: data.volume24h || 0,
              marketCap: estimatedMarketCap,
              launchTime: null,
              liquidityScore: null,
              riskScore: null,
              smartMoneyActivity: null
            };
          });
          
          return tokenPrices.slice(0, limit);
        }
      }
    } catch (error) {
      console.error('Error fetching market data from Jupiter:', error);
    }
    
    // Try Helius as a fallback
    try {
      const tokenPrices = await getTokenPrices(tokenMints.slice(0, limit));

      if (tokenPrices && tokenPrices.length > 0) {
        return tokenPrices.map((token: any) => {
          // Calculate an estimated market cap based on available data
          const estimatedMarketCap = token.price * (token.volume24h / (token.price * 0.05) || 1000000);
          
          const symbol = token.symbol || getSymbolFromMint(token.mint);
          
          return {
            name: token.name || getSymbolFromMint(token.mint),
            symbol: token.symbol || getSymbolFromMint(token.mint),
            price: token.price || 0,
            change24h: token.priceChange24h || 0,
            volume24h: token.volume24h || 0,
            marketCap: estimatedMarketCap,
            launchTime: null,
            liquidityScore: null,
            riskScore: null,
            smartMoneyActivity: null
          };
        }).slice(0, limit);
      }
    } catch (error) {
      console.error('Error fetching market data from Helius:', error);
    }

    // If all APIs failed, return empty array
    console.log('All APIs failed, returning empty array');
    return [];
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return [];
  }
};

/**
 * Get historical price data for a token
 * @param symbol Token symbol
 * @param days Number of days of history to return
 * @returns Array of price datapoints
 */
export const getTokenPriceHistory = async (symbol: string, days = 7) => {
  try {
    // Try to get real historical data
    let currentPrice = 0;
    
    // Get current price first
    try {
      const mint = SOLANA_TOKEN_MINTS[symbol as keyof typeof SOLANA_TOKEN_MINTS];
      if (mint) {
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
        
        if (response.ok) {
          const priceData = await response.json();
          if (priceData && priceData.data && priceData.data[mint]) {
            currentPrice = priceData.data[mint].price;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current token price:', error);
    }
    
    if (currentPrice === 0) {
      // Return empty array if we couldn't get the current price
      return [];
    }
    
    // In production, this would fetch historical data from an API
    // For now, return empty array as we don't want mock data
    return [];
  } catch (error) {
    console.error(`Failed to get price history for ${symbol}:`, error);
    return [];
  }
};

/**
 * Get crypto market statistics
 * @returns Market statistics object
 */
export const getMarketStats = async () => {
  try {
    // Try to get some real stats
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          const { total_market_cap, total_volume, market_cap_percentage } = data.data;
          
          return {
            marketCap: total_market_cap.usd || 0,
            volume24h: total_volume.usd || 0,
            solDominance: market_cap_percentage.sol || 0,
            activeTokens: 0,
            gainers24h: 0,
            losers24h: 0
          };
        }
      }
    } catch (error) {
      console.error('Error fetching market stats from CoinGecko:', error);
    }

    // If API call fails, return zeros instead of mock data
    return {
      marketCap: 0,
      volume24h: 0,
      solDominance: 0,
      activeTokens: 0,
      gainers24h: 0,
      losers24h: 0
    };
  } catch (error) {
    console.error('Failed to get market stats:', error);
    return {
      marketCap: 0,
      volume24h: 0,
      solDominance: 0,
      activeTokens: 0,
      gainers24h: 0,
      losers24h: 0
    };
  }
};

/**
 * Helper function to get symbol from mint address
 */
const getSymbolFromMint = (mintAddress: string): string => {
  const entries = Object.entries(SOLANA_TOKEN_MINTS);
  for (const [symbol, mint] of entries) {
    if (mint === mintAddress) return symbol;
  }
  return 'UNKNOWN';
};

/**
 * Format currency amount based on currency and amount
 * @param amount Amount to format
 * @param currency Currency code (USD, EUR, etc)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string) => {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    KES: 'KSh'
  };

  const symbol = currencySymbols[currency] || '$';
  
  if (currency === 'JPY') {
    return `${symbol}${amount.toFixed(0)}`;
  }
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
