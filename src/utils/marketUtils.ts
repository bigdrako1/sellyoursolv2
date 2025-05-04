
/**
 * Market utilities for SellYourSOL V2 AI trading platform
 * Functions to interact with market data from Solana ecosystem
 */

import { getTokenPrices, heliusRpcCall } from './apiUtils';

// Mock data for testing when API is unavailable
const MOCK_TOKEN_DATA = [
  {
    name: "Solana",
    symbol: "SOL",
    price: 145.24,
    change24h: 2.34,
    volume24h: 2354657890,
  },
  {
    name: "SellYourSOL",
    symbol: "SYS",
    price: 0.052,
    change24h: 4.25,
    volume24h: 9874560,
  },
  {
    name: "Raydium",
    symbol: "RAY",
    price: 1.24,
    change24h: -1.85,
    volume24h: 53487690,
  },
  {
    name: "Serum",
    symbol: "SRM",
    price: 0.78,
    change24h: 0.95,
    volume24h: 28546789,
  },
  {
    name: "Marinade SOL",
    symbol: "mSOL",
    price: 160.35,
    change24h: 2.45,
    volume24h: 456789230,
  },
  {
    name: "USDC",
    symbol: "USDC",
    price: 1.00,
    change24h: 0.01,
    volume24h: 8976543210,
  },
];

// Common Solana token mints - typically we'd get these from an API but hardcoded for reliability
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
    // Get token prices from Helius API
    const tokenMints = Object.values(SOLANA_TOKEN_MINTS);
    const tokenPrices = await getTokenPrices(tokenMints.slice(0, limit));

    // If we have token prices, process them
    if (tokenPrices && tokenPrices.length > 0) {
      return tokenPrices.map((token: any) => ({
        name: token.name || getSymbolFromMint(token.mint),
        symbol: token.symbol || getSymbolFromMint(token.mint),
        price: token.price || 0,
        change24h: token.priceChange24h || 0,
        volume24h: token.volume24h || 0
      })).slice(0, limit);
    }

    // Fallback to mock data if API failed
    console.log('Using mock market data as fallback');
    return MOCK_TOKEN_DATA.slice(0, limit);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return MOCK_TOKEN_DATA.slice(0, limit);
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
    // Simulate price history data until API is integrated
    const currentPrice = MOCK_TOKEN_DATA.find(t => t.symbol === symbol)?.price || 100;
    
    // Generate mock price history
    const history = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random price variation +/- 5%
      const variation = (Math.random() * 10 - 5) / 100;
      const price = currentPrice * (1 + variation * (i + 1) / 2);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2))
      });
    }
    
    return history;
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
    // This would be replaced with actual API call in production
    return {
      marketCap: 1456789000000,
      volume24h: 56789000000,
      solDominance: 4.5,
      activeTokens: 3456,
      gainers24h: 234,
      losers24h: 176
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
