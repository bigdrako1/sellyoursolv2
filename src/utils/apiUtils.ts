// API utility functions for interacting with Solana blockchain and external services
import { PublicKey } from '@solana/web3.js';

// Constants
const DEFAULT_PUBLIC_KEY = new PublicKey('11111111111111111111111111111111');

// Interfaces
interface TokenMetadata {
  name: string;
  symbol: string;
  logo: string;
  mint: string;
}

import { waitForRateLimit, setRateLimitTier, RateLimitTier } from './rateLimit';

// Configure the initial rate limit tier (can be updated in settings)
setRateLimitTier('heliusRpc', RateLimitTier.FREE);
setRateLimitTier('heliusApi', RateLimitTier.FREE);

// API helpers
/**
 * Fetches the metadata for a given token mint address
 * @param mintAddress Token mint address
 * @returns Token metadata or null if not found
 */
export const getTokenMetadata = async (mintAddress: string): Promise<TokenMetadata | null> => {
  try {
    // Mock implementation - would call a token metadata service in a real app
    const metadata: TokenMetadata = {
      name: "Mock Token",
      symbol: "MOCK",
      logo: "https://example.com/mock.png",
      mint: mintAddress
    };
    
    return metadata;
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return null;
  }
};

/**
 * Checks the health of the Helius API connection
 * @returns True if the connection is healthy, false otherwise
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    // Mock implementation - would call a simple Helius API endpoint in a real app
    // For example, get recent transactions
    await heliusApiCall('transactions?account=6oGsL2puUfaasH1jEzK9wqmZYjEQNBYWtgLBH9GuYxEe&limit=1');
    return true;
  } catch (error) {
    console.error("Helius API connection test failed:", error);
    return false;
  }
};

/**
 * Fetches recent transactions for a given wallet address
 * @param walletAddress Wallet address to fetch transactions for
 * @param limit Number of transactions to fetch
 * @returns List of transactions
 */
export const getRecentTransactions = async (walletAddress: string, limit: number = 10): Promise<any[]> => {
  try {
    // Mock implementation - would call Helius API in a real app
    const transactions = Array.from({ length: limit }, (_, i) => ({
      txHash: `${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      timestamp: new Date().toISOString(),
      gasUsed: Math.random() * 0.0001
    }));
    
    return transactions;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
};

/**
 * Makes an API call to Helius API with rate limiting
 * @param endpoint API endpoint path
 * @param options Fetch options
 * @returns Response data
 */
export const heliusApiCall = async (endpoint: string, options = {}) => {
  try {
    // Wait for rate limit clearance
    await waitForRateLimit('heliusApi');
    
    const baseURL = 'https://api.helius.xyz/v0';
    const apiKey = 'a18d2c93-d9fa-4db2-8419-707a4f1782f7'; // This should be stored securely in production
    const url = `${baseURL}/${endpoint}?api-key=${apiKey}`;
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`Helius API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Helius API call failed:", error);
    throw error;
  }
};

/**
 * Makes an RPC call to Helius with rate limiting
 * @param method RPC method name
 * @param params RPC parameters
 * @returns Response data
 */
export const heliusRpcCall = async (method: string, params: any[] = []) => {
  try {
    // Wait for rate limit clearance
    await waitForRateLimit('heliusRpc');
    
    const apiKey = 'a18d2c93-d9fa-4db2-8419-707a4f1782f7'; // This should be stored securely in production
    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method,
        params
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Helius RPC error: ${data.error.message}`);
    }
    
    return data.result;
  } catch (error) {
    console.error("Helius RPC call failed:", error);
    throw error;
  }
};

/**
 * Fetches the current SOL price in USD
 * @returns SOL price in USD
 */
export const getSolPrice = async (): Promise<number> => {
  try {
    // Mock implementation - would call a price API in a real app
    return Math.random() * 50 + 150; // Random price between $150 and $200
  } catch (error) {
    console.error("Error fetching SOL price:", error);
    return 0;
  }
};

/**
 * Fetches the 24h change for a token
 * @param tokenSymbol Token symbol
 * @returns 24h change percentage
 */
export const getToken24hChange = async (tokenSymbol: string): Promise<number> => {
  try {
    // Mock implementation - would call a market data API in a real app
    return (Math.random() * 20) - 10; // Random change between -10% and +10%
  } catch (error) {
    console.error("Error fetching token 24h change:", error);
    return 0;
  }
};

/**
 * Update the Helius API rate limit tier based on subscription
 * @param tier New rate limit tier
 */
export const updateHeliusRateLimitTier = (tier: RateLimitTier) => {
  setRateLimitTier('heliusRpc', tier);
  setRateLimitTier('heliusApi', tier);
};
