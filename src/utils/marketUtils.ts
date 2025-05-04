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
            
            // Generate random values for demo purposes - in production these would come from your AI analysis
            const launchTime = getRandomLaunchTime(symbol);
            const liquidityScore = getRandomMetric(symbol, 40, 90);
            const riskScore = getRandomMetric(symbol, 20, 85);
            const smartMoneyActivity = getSmartMoneyMetric(symbol);
            
            return {
              name: data.name || symbol,
              symbol: symbol,
              price: data.price || 0,
              change24h: data.priceChange24h || 0,
              volume24h: data.volume24h || 0,
              marketCap: estimatedMarketCap,
              launchTime,
              liquidityScore,
              riskScore,
              smartMoneyActivity
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
          
          // Generate random values for demo purposes - in production these would come from your AI analysis
          const symbol = token.symbol || getSymbolFromMint(token.mint);
          const launchTime = getRandomLaunchTime(symbol);
          const liquidityScore = getRandomMetric(symbol, 40, 90);
          const riskScore = getRandomMetric(symbol, 20, 85);
          const smartMoneyActivity = getSmartMoneyMetric(symbol);
          
          return {
            name: token.name || getSymbolFromMint(token.mint),
            symbol: token.symbol || getSymbolFromMint(token.mint),
            price: token.price || 0,
            change24h: token.priceChange24h || 0,
            volume24h: token.volume24h || 0,
            marketCap: estimatedMarketCap,
            launchTime,
            liquidityScore,
            riskScore,
            smartMoneyActivity
          };
        }).slice(0, limit);
      }
    } catch (error) {
      console.error('Error fetching market data from Helius:', error);
    }

    // Fallback to mock data if both APIs failed
    console.log('Using mock market data as final fallback');
    return [
      { 
        name: "Solana", 
        symbol: "SOL", 
        price: 149.87, 
        change24h: 3.24, 
        volume24h: 2354657890, 
        marketCap: 57892345680,
        launchTime: Date.now() - (86400000 * 1000), // Old token
        liquidityScore: 95,
        riskScore: 12,
        smartMoneyActivity: 85
      },
      { 
        name: "SellYourSOL", 
        symbol: "SYS", 
        price: 0.057, 
        change24h: 5.12, 
        volume24h: 9874560, 
        marketCap: 4567890,
        launchTime: Date.now() - (3600000 * 12), // 12 hours ago
        liquidityScore: 65,
        riskScore: 45,
        smartMoneyActivity: 75
      },
      { 
        name: "Raydium", 
        symbol: "RAY", 
        price: 1.35, 
        change24h: -0.87, 
        volume24h: 53487690, 
        marketCap: 134567890,
        launchTime: Date.now() - (86400000 * 180), // Old token
        liquidityScore: 88,
        riskScore: 18,
        smartMoneyActivity: 40
      },
      { 
        name: "Serum", 
        symbol: "SRM", 
        price: 0.82, 
        change24h: 1.23, 
        volume24h: 28546789, 
        marketCap: 82456789,
        launchTime: Date.now() - (86400000 * 365), // Old token
        liquidityScore: 75,
        riskScore: 35,
        smartMoneyActivity: 35
      },
      { 
        name: "Marinade SOL", 
        symbol: "mSOL", 
        price: 165.24, 
        change24h: 3.12, 
        volume24h: 456789230, 
        marketCap: 5234567890,
        launchTime: Date.now() - (86400000 * 400), // Old token
        liquidityScore: 90,
        riskScore: 15,
        smartMoneyActivity: 60
      },
      {
        name: "Drako Token", 
        symbol: "DRAKO", 
        price: 0.0023, 
        change24h: 125.87, 
        volume24h: 3487690, 
        marketCap: 980000,
        launchTime: Date.now() - (3600000 * 4), // 4 hours ago - brand new!
        liquidityScore: 45,
        riskScore: 75,
        smartMoneyActivity: 92 // High smart money interest
      },
      {
        name: "AI Trading Bot", 
        symbol: "AIBOT", 
        price: 0.0187, 
        change24h: 32.45, 
        volume24h: 1245670, 
        marketCap: 2150000,
        launchTime: Date.now() - (86400000 * 2), // 2 days ago
        liquidityScore: 58,
        riskScore: 62,
        smartMoneyActivity: 78
      },
    ].slice(0, limit);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return [];
  }
};

// Generate deterministic but random-looking values for demo purposes
const getRandomMetric = (seed: string, min: number, max: number): number => {
  // Simple hash function to generate a deterministic value from a string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Scale to min-max range
  return Math.floor(Math.abs(hash % (max - min)) + min);
};

// Create a "realistic" launch time distribution
const getRandomLaunchTime = (symbol: string): number => {
  // Well-known tokens are older
  if (["SOL", "SRM", "RAY", "mSOL"].includes(symbol)) {
    // 6 months to 2 years ago
    const daysAgo = getRandomMetric(symbol, 180, 730);
    return Date.now() - (86400000 * daysAgo);
  }
  
  // Custom demo token (new and interesting)
  if (symbol === "DRAKO") {
    // 2-6 hours ago
    const hoursAgo = getRandomMetric(symbol, 2, 6);
    return Date.now() - (3600000 * hoursAgo);
  }
  
  if (symbol === "AIBOT" || symbol === "SYS") {
    // 1-3 days ago
    const daysAgo = getRandomMetric(symbol, 1, 3);
    return Date.now() - (86400000 * daysAgo);
  }
  
  // Random value - between 1 day and 3 months ago
  const daysAgo = getRandomMetric(symbol, 1, 90);
  return Date.now() - (86400000 * daysAgo);
};

// Smart money is watching tokens with certain patterns
const getSmartMoneyMetric = (symbol: string): number => {
  // Demo cases for interesting tokens with smart money
  if (symbol === "DRAKO") return 92; // High smart money interest
  if (symbol === "AIBOT") return 78;
  if (symbol === "SYS") return 75;
  if (symbol === "SOL") return 85; // SOL always has smart money

  // Other tokens have varying levels
  return getRandomMetric(symbol, 0, 60);
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
      // Fallback if we couldn't get the current price
      currentPrice = symbol === 'SOL' ? 150 : 
                     symbol === 'SYS' ? 0.05 :
                     symbol === 'RAY' ? 1.25 :
                     symbol === 'SRM' ? 0.75 :
                     symbol === 'mSOL' ? 160 : 100;
    }
    
    // Generate historical data based on current price
    // In a production app, this would use real historical data from an API
    const history = [];
    const now = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // More realistic price variation
      const dayFactor = i / days; // Factor to create a trend
      const trendDirection = Math.random() > 0.5 ? 1 : -1; // Random trend direction
      const trendStrength = Math.random() * 0.15; // How strong the trend is
      
      // Calculate variation (stronger near current time)
      const variation = (Math.random() * 0.08 - 0.04) + (trendDirection * trendStrength * dayFactor);
      const price = currentPrice * (1 + variation * (days - i + 1));
      
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
    // Try to get some real stats first
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/global');
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          const { total_market_cap, total_volume, market_cap_percentage } = data.data;
          
          return {
            marketCap: total_market_cap.usd || 1456789000000,
            volume24h: total_volume.usd || 56789000000,
            solDominance: market_cap_percentage.sol || 4.5,
            activeTokens: 3456,
            gainers24h: 234,
            losers24h: 176
          };
        }
      }
    } catch (error) {
      console.error('Error fetching market stats from CoinGecko:', error);
    }

    // Fallback with realistic mock data
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
