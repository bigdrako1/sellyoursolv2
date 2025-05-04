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

    return [];
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return [];
  }
};

/**
 * Get trending tokens across multiple Solana DEXes
 * @param limit Number of tokens to return
 * @returns Array of trending token data
 */
export const getTrendingTokens = async (limit = 5) => {
  try {
    // Try to get trending tokens from multiple sources
    const trendingTokens: any[] = [];
    const uniqueTokens = new Set<string>(); // Track unique tokens by symbol
    
    // Try Jupiter trending tokens API
    try {
      const response = await fetch('https://station.jup.ag/api/trending-tokens');
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          console.log("Jupiter trending tokens:", data.length);
          for (const token of data.slice(0, Math.min(10, data.length))) {
            if (token.address && !uniqueTokens.has(token.symbol)) {
              uniqueTokens.add(token.symbol);
              // Get price data
              try {
                const priceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${token.address}`);
                const priceData = await priceResponse.json();
                const price = priceData?.data?.[token.address]?.price || 0;
                const change24h = priceData?.data?.[token.address]?.priceChange24h || 0;
                
                trendingTokens.push({
                  name: token.name || 'Unknown Token',
                  symbol: token.symbol || token.address.substring(0, 4),
                  price: price,
                  change24h: change24h,
                  volume24h: 0, 
                  source: 'Jupiter'
                });
              } catch (err) {
                console.error("Error fetching price data for Jupiter token:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trending tokens from Jupiter:', error);
    }
    
    // Try Raydium trending tokens
    try {
      const response = await fetch('https://api.raydium.io/v2/main/trending-tokens');
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
          console.log("Raydium trending tokens:", data.data.length);
          for (const token of data.data.slice(0, Math.min(10, data.data.length))) {
            // Check if token is already added
            if (token.symbol && !uniqueTokens.has(token.symbol)) {
              uniqueTokens.add(token.symbol);
              trendingTokens.push({
                name: token.name || 'Unknown Token',
                symbol: token.symbol,
                price: token.price || 0,
                change24h: token.priceChange24h || 0,
                volume24h: token.volume24h || 0,
                source: 'Raydium'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trending tokens from Raydium:', error);
    }
    
    // Try DexScreener trending
    try {
      const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=trending&sort=rank&desc=true');
      if (response.ok) {
        const data = await response.json();
        if (data && data.pairs && Array.isArray(data.pairs)) {
          // Filter for Solana pairs only
          const solanaPairs = data.pairs.filter((pair: any) => pair.chainId === 'solana');
          console.log("DexScreener trending Solana pairs:", solanaPairs.length);
          
          for (const pair of solanaPairs.slice(0, Math.min(10, solanaPairs.length))) {
            // Check if token is already added
            if (pair.baseToken.symbol && !uniqueTokens.has(pair.baseToken.symbol)) {
              uniqueTokens.add(pair.baseToken.symbol);
              trendingTokens.push({
                name: pair.baseToken.name || 'Unknown Token',
                symbol: pair.baseToken.symbol,
                price: parseFloat(pair.priceUsd) || 0,
                change24h: parseFloat(pair.priceChange.h24) || 0,
                volume24h: parseFloat(pair.volume.h24) || 0,
                source: 'DexScreener'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trending tokens from DexScreener:', error);
    }
    
    // Try Birdeye trending tokens (optional)
    try {
      const response = await fetch('https://public-api.birdeye.so/defi/token_list?sort_by=v24hUSD&sort_type=desc&offset=0&limit=20', {
        headers: {
          'x-chain': 'solana',
          'x-api-key': '67f79318c29e4eda99c3184c2ac65116'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data.items)) {
          console.log("Birdeye trending tokens:", data.data.items.length);
          for (const token of data.data.items.slice(0, Math.min(10, data.data.items.length))) {
            // Check if token is already added
            if (token.symbol && !uniqueTokens.has(token.symbol)) {
              uniqueTokens.add(token.symbol);
              trendingTokens.push({
                name: token.name || 'Unknown Token',
                symbol: token.symbol,
                price: token.price || 0,
                change24h: token.priceChange24h || 0,
                volume24h: token.volume24h || 0,
                source: 'Birdeye'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching trending tokens from Birdeye:', error);
    }
    
    console.log(`Total unique trending tokens: ${trendingTokens.length}`);
    
    // If we couldn't get any trending tokens, return the main tokens as fallback
    if (trendingTokens.length === 0) {
      const mainTokens = await getMarketOverview(limit);
      return mainTokens.map(token => ({...token, source: 'Main Tokens'}));
    }
    
    // Ensure we only return the requested limit
    return trendingTokens.slice(0, limit);
  } catch (error) {
    console.error('Failed to get trending tokens:', error);
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
    const dataPoints = [];
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
            
            // Try to get historical data from CoinGecko (if it's a major token)
            if (symbol === 'SOL' || symbol === 'RAY' || symbol === 'SRM') {
              try {
                const geckoId = symbol === 'SOL' ? 'solana' : 
                               symbol === 'RAY' ? 'raydium' : 
                               symbol === 'SRM' ? 'serum' : null;
                
                if (geckoId) {
                  const hoursParam = days * 24;
                  const historyResponse = await fetch(
                    `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart?vs_currency=usd&days=${days}`
                  );
                  
                  if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    
                    if (historyData && historyData.prices && Array.isArray(historyData.prices)) {
                      return historyData.prices.map((item: [number, number]) => {
                        const date = new Date(item[0]);
                        return {
                          time: formatTimeForChartDisplay(date, days),
                          price: item[1],
                          fullDate: date
                        };
                      });
                    }
                  }
                }
              } catch (err) {
                console.error(`Failed to get CoinGecko history for ${symbol}:`, err);
              }
            }
            
            // Try to get history from Birdeye as fallback
            try {
              const birdeyeResponse = await fetch(
                `https://public-api.birdeye.so/defi/price_history?address=${mint}&type=1&time_from=${getTimeFrom(days)}`,
                {
                  headers: {
                    'x-chain': 'solana',
                    'x-api-key': '67f79318c29e4eda99c3184c2ac65116'
                  }
                }
              );
              
              if (birdeyeResponse.ok) {
                const birdeyeData = await birdeyeResponse.json();
                
                if (birdeyeData && birdeyeData.data && Array.isArray(birdeyeData.data.items)) {
                  return birdeyeData.data.items.map((item: any) => {
                    const date = new Date(item.unixTime * 1000);
                    return {
                      time: formatTimeForChartDisplay(date, days),
                      price: item.value,
                      fullDate: date
                    };
                  });
                }
              }
            } catch (err) {
              console.error(`Failed to get Birdeye history for ${symbol}:`, err);
            }
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
    
    // If we couldn't get history from any source, generate some data points based on current price
    // This ensures we have at least something to show in the chart
    const now = new Date();
    const intervals = days <= 1 ? 24 : days * 8; // 24 points for 1 day, 8 points per day for longer periods
    const startTime = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    for (let i = 0; i <= intervals; i++) {
      const pointTime = new Date(startTime.getTime() + (i * (days * 24 * 60 * 60 * 1000) / intervals));
      const randomFactor = 0.98 + (Math.random() * 0.04); // Small random factor ±2%
      
      dataPoints.push({
        time: formatTimeForChartDisplay(pointTime, days),
        price: currentPrice * randomFactor,
        fullDate: pointTime
      });
    }
    
    return dataPoints;
  } catch (error) {
    console.error(`Failed to get price history for ${symbol}:`, error);
    return [];
  }
};

// Helper function to get timestamp from X days ago
const getTimeFrom = (days: number): number => {
  return Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
};

// Helper function to format time for chart display based on timeframe
const formatTimeForChartDisplay = (date: Date, days: number): string => {
  if (days <= 1/24) { // 1 hour
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days <= 1) { // 1 day
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else { // Multiple days
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
