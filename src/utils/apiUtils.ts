
import { toast } from "@/hooks/use-toast";

// API keys (should be moved to environment variables in production)
export const HELIUS_API_KEY = "a18d2c93-d9fa-4db2-8419-707a4f1782f7";
export const BIRDEYE_API_KEY = "67f79318c29e4eda99c3184c2ac65116";
export const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImZlMjk1MDllLWQ0YWMtNDI0YS1hMDg4LTBhZTgwNTdkNzgyNyIsIm9yZ0lkIjoiNDQzOTg4IiwidXNlcklkIjoiNDU2ODA3IiwidHlwZUlkIjoiZGYxNjU0MWYtNTJhNy00MGFiLWFiN2EtODYxZTliYmZiN2U4IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDU2ODIzODUsImV4cCI6NDkwMTQ0MjM4NX0.eAg55zBFSaFEnnuKA_EmP-u-61Hkb6YqM8v1YhWduAo";

// API endpoints
export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_API_BASE = "https://api.helius.xyz/v0";
export const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

/**
 * Test connection to Helius API
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(HELIUS_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'helius-connection-test',
        method: 'getHealth',
      }),
    });
    
    const data = await response.json();
    return data.result === "ok" || data.result === 1;
  } catch (error) {
    console.error("Helius API connection failed:", error);
    return false;
  }
};

/**
 * Handle API errors consistently
 */
export const handleApiError = (error: any, context: string): void => {
  console.error(`API Error (${context}):`, error);
  
  // Determine if it's a rate limit error
  const isRateLimit = error?.response?.status === 429 || 
                      error?.message?.includes('rate limit') ||
                      error?.message?.includes('too many requests');
  
  // Show appropriate toast
  if (isRateLimit) {
    toast({
      title: "API Rate Limit Exceeded",
      description: `Rate limit reached for ${context}. Please try again later.`,
      variant: "destructive",
    });
  } else {
    toast({
      title: "API Request Failed",
      description: `Failed to ${context}. ${error.message || 'Please try again.'}`,
      variant: "destructive",
    });
  }
};
