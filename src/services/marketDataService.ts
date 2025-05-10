// Market Data Service for fetching historical and real-time market data
import APP_CONFIG from '@/config/appDefinition';
import { BIRDEYE_API_KEY, BIRDEYE_API_BASE, JUPITER_API_BASE, handleApiError } from '@/utils/apiUtils';
import { waitForRateLimit } from '@/utils/rateLimit';

// API endpoints
const HELIUS_API_KEY = APP_CONFIG.api.defaultApiKey;
const HELIUS_API_BASE = "https://api.helius.xyz/v0";
const BIRDEYE_API_KEY = "5d1a0d16f9b74683a5c6c0242e3b5f7f"; // Replace with your API key
const BIRDEYE_API_BASE = "https://public-api.birdeye.so";
const JUPITER_API_BASE = "https://price.jup.ag/v4";

/**
 * Fetch historical price data for a token
 * @param symbol Token symbol or address
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param timeframe Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
 * @returns Historical price data
 */
export const fetchHistoricalData = async (
  symbol: string,
  startDate: string,
  endDate: string,
  timeframe: string = '1h'
): Promise<any[]> => {
  try {
    await waitForRateLimit('birdeyeApi');

    // Determine if symbol is an address or a token symbol
    const isAddress = symbol.length > 20;

    // If it's a symbol, try to get the address first
    let tokenAddress = symbol;
    if (!isAddress) {
      tokenAddress = await getTokenAddressBySymbol(symbol);
    }

    // Convert timeframe to BirdEye format
    const resolution = convertTimeframeToResolution(timeframe);

    // Convert dates to timestamps
    const from = Math.floor(new Date(startDate).getTime() / 1000);
    const to = Math.floor(new Date(endDate).getTime() / 1000);

    // Fetch data from BirdEye
    const url = `${BIRDEYE_API_BASE}/defi/ohlcv?address=${tokenAddress}&type=token&resolution=${resolution}&from=${from}&to=${to}`;

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`BirdEye API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data to our format
    if (data && data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        timestamp: new Date(item.time * 1000).toISOString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching historical data:", error);
    throw error;
  }
};

/**
 * Get token address by symbol
 * @param symbol Token symbol
 * @returns Token address
 */
const getTokenAddressBySymbol = async (symbol: string): Promise<string> => {
  try {
    await waitForRateLimit('birdeyeApi');

    // Normalize symbol
    const normalizedSymbol = symbol.toUpperCase();

    // Common token addresses
    const commonTokens: Record<string, string> = {
      'SOL': 'So11111111111111111111111111111111111111112',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      'JTO': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
      'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
      'PYTH': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3'
    };

    // Check if it's a common token
    if (commonTokens[normalizedSymbol]) {
      return commonTokens[normalizedSymbol];
    }

    // Search for token
    const url = `${BIRDEYE_API_BASE}/public/tokenlist?search=${normalizedSymbol}`;

    const response = await fetch(url, {
      headers: {
        'X-API-KEY': BIRDEYE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`BirdEye API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Find exact match
    const exactMatch = data.data.tokens.find((token: any) =>
      token.symbol.toUpperCase() === normalizedSymbol
    );

    if (exactMatch) {
      return exactMatch.address;
    }

    // If no exact match, return the first result
    if (data.data.tokens.length > 0) {
      return data.data.tokens[0].address;
    }

    throw new Error(`Token symbol ${symbol} not found`);
  } catch (error) {
    console.error(`Error getting token address for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Convert timeframe to BirdEye resolution
 * @param timeframe Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
 * @returns BirdEye resolution
 */
const convertTimeframeToResolution = (timeframe: string): string => {
  switch (timeframe) {
    case '1m': return '1';
    case '5m': return '5';
    case '15m': return '15';
    case '1h': return '60';
    case '4h': return '240';
    case '1d': return 'D';
    default: return '60'; // Default to 1h
  }
};

/**
 * Get real-time market data for multiple tokens
 * @param symbols Array of token symbols or addresses
 * @returns Real-time market data
 */
export const getRealTimeMarketData = async (symbols: string[]): Promise<any[]> => {
  try {
    await waitForRateLimit('jupiterApi');

    // Join symbols with comma
    const symbolsString = symbols.join(',');

    // Fetch data from Jupiter
    const url = `${JUPITER_API_BASE}/price?ids=${symbolsString}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform data to our format
    return Object.entries(data.data).map(([symbol, info]: [string, any]) => ({
      symbol,
      price: info.price,
      change24h: info.priceChange24h || 0,
      volume24h: info.volume24h || 0
    }));
  } catch (error) {
    console.error("Error fetching real-time market data:", error);
    throw error;
  }
};
