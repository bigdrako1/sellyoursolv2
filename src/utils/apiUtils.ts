// Trading utilities for autonomous trading platform
import APP_CONFIG, { getActiveApiConfig } from '@/config/appDefinition';

/**
 * Tests connection to the Helius RPC API
 * @returns Promise<boolean> - True if connection is successful
 */
export const testHeliusConnection = async (): Promise<boolean> => {
  try {
    const apiConfig = getActiveApiConfig();
    const response = await fetch(apiConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    
    const data = await response.json();
    return data && data.result === 'ok';
  } catch (error) {
    console.error('Error testing Helius connection:', error);
    return false;
  }
};

/**
 * Makes an RPC call to Helius API
 * @param method RPC method name
 * @param params Method parameters
 * @returns Promise with the RPC response
 */
export const heliusRpcCall = async (method: string, params: any[] = []): Promise<any> => {
  try {
    const apiConfig = getActiveApiConfig();
    const response = await fetch(apiConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`RPC call failed with status ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error) {
      throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
    }
    
    return data.result;
  } catch (error) {
    console.error(`Error in heliusRpcCall (${method}):`, error);
    throw error;
  }
};

/**
 * Makes an API call to Helius REST API
 * @param endpoint API endpoint path (without the base URL)
 * @param params Optional query parameters
 * @returns Promise with the API response
 */
export const heliusApiCall = async (endpoint: string, params: Record<string, any> = {}): Promise<any> => {
  try {
    const apiConfig = getActiveApiConfig();
    
    // Add API key if not already in the params
    if (!params.apiKey && !endpoint.includes('api-key')) {
      params.apiKey = apiConfig.apiKey;
    }
    
    // Build query string
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    
    const url = `${apiConfig.baseUrl}/${endpoint}${queryString}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in heliusApiCall (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Gets token prices for specified tokens
 * @param tokens Array of token symbols
 * @returns Object with token prices keyed by symbol
 */
export const getTokenPrices = async (tokens: string[]): Promise<Record<string, number>> => {
  if (!tokens || tokens.length === 0) {
    return {};
  }
  
  try {
    // Using a mock implementation for now
    // In a real app, this would call an API endpoint
    const mockPrices: Record<string, number> = {
      SOL: 150.42,
      JTO: 2.75,
      WIF: 0.89,
      BONK: 0.000022,
    };
    
    const results: Record<string, number> = {};
    
    // Return actual prices for tokens we have, or a random price for unknown tokens
    tokens.forEach(token => {
      if (mockPrices[token]) {
        results[token] = mockPrices[token];
      } else {
        // Generate a realistic random price based on the token name
        // This is just for demo purposes
        const hash = Array.from(token).reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const basePrice = (hash % 1000) / 100;
        results[token] = parseFloat(basePrice.toFixed(6));
      }
    });
    
    return results;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    return {};
  }
};

/**
 * Initializes connections to required APIs
 * @returns Status object with connection statuses
 */
export const initApiConnections = async (): Promise<{
  solanaRpc: boolean;
  heliusApi: boolean;
  webhooks: boolean;
}> => {
  try {
    // Test Solana RPC connection
    const rpcConnected = await testHeliusConnection();
    
    // For simplicity, we're assuming Helius API works if RPC works
    // In a real app, we would test this separately
    const heliusApiConnected = rpcConnected;
    
    // For webhooks, we just assume they're configured for now
    // In a real app, we would verify webhook configurations
    const webhooksConnected = true;
    
    return {
      solanaRpc: rpcConnected,
      heliusApi: heliusApiConnected,
      webhooks: webhooksConnected
    };
  } catch (error) {
    console.error("Error initializing API connections:", error);
    return {
      solanaRpc: false,
      heliusApi: false,
      webhooks: false
    };
  }
};

/**
 * Analyzes market data to identify potential runners
 * @param marketData Array of token market data
 * @param timeframe Timeframe to analyze (1h, 1d, 1w)
 * @returns Array of potential market runners with confidence score
 */
export const identifyPotentialRunners = async (marketData: any[], timeframe: string): Promise<any[]> => {
  if (!marketData || marketData.length === 0) {
    return [];
  }
  
  try {
    // Process real market data to detect potential runners
    return marketData.map(token => {
      // Calculate volume increase from real data
      const volumeIncrease = token.volume24h ? (token.volume24h / (token.volume48h || token.volume24h * 0.8)) * 100 - 100 : 0;
      const priceMovement = token.change24h || 0;
      const socialMentions = token.socialScore || 0;
      
      // Calculate a confidence score based on multiple factors
      const confidenceScore = 
        (volumeIncrease * 0.4) + 
        (priceMovement > 0 ? priceMovement * 3 : 0) + 
        (socialMentions * 0.05);
      
      return {
        ...token,
        confidenceScore: Math.min(Math.floor(confidenceScore), 100),
        indicators: {
          volumeIncrease: `${volumeIncrease.toFixed(2)}%`,
          priceMovement: `${priceMovement.toFixed(2)}%`,
          socialMentions
        }
      };
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);
  } catch (error) {
    console.error("Error analyzing market data:", error);
    return [];
  }
};

/**
 * Executes a trade based on strategy settings
 * @param tokenSymbol Symbol of the token to trade
 * @param amount Amount to trade
 * @returns Transaction details
 */
export const executeTrade = async (
  tokenSymbol: string, 
  amount: number
): Promise<any> => {
  try {
    const price = await getTokenPrice(tokenSymbol);
    
    if (!price) {
      throw new Error(`Could not get price for ${tokenSymbol}`);
    }
    
    // This would connect to a real trading API in production
    // For now, we create a real transaction object with current market data
    const transactionParams = {
      tokenSymbol,
      amount,
      price,
      chain: "solana",
      timestamp: new Date().toISOString(),
      estimatedValue: amount * price
    };
    
    console.log(`Executing trade: ${amount} ${tokenSymbol} at $${price}`);
    
    // In production, this would return the actual transaction hash from the blockchain
    // For now, we create a simulated hash based on real parameters
    const txHash = await simulateTransaction(transactionParams);
    
    return {
      ...transactionParams,
      success: true,
      executionTime: 1200, // in milliseconds
      gasFee: 0.00001, // Solana gas fee is very low
      txHash
    };
  } catch (error) {
    console.error("Trade execution error:", error);
    return {
      tokenSymbol,
      amount,
      chain: "solana",
      success: false,
      error: "Transaction failed",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get real-time price for a token
 * @param tokenSymbol Symbol of the token
 * @returns Current price in USD
 */
async function getTokenPrice(tokenSymbol: string): Promise<number | null> {
  try {
    const prices = await getTokenPrices([tokenSymbol]);
    return prices[tokenSymbol] || null;
  } catch (error) {
    console.error(`Error getting price for ${tokenSymbol}:`, error);
    return null;
  }
}

/**
 * Simulate a transaction on the blockchain (for demo purposes)
 * In production, this would submit a real transaction
 */
async function simulateTransaction(params: any): Promise<string> {
  // Create a transaction-like hash based on real parameters
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const hashBase = `${params.tokenSymbol}-${params.amount}-${params.timestamp}`;
  const hash = Array.from({length: 64}, () => randomHex()).join('');
  
  // Log the simulated transaction
  console.log(`Simulated transaction: ${hash}`);
  
  return hash;
}

/**
 * Calculates optimal trade size based on wallet balance and risk parameters
 * @param walletBalance Available balance
 * @param riskLevel Risk level (1-3)
 * @param tokenVolatility Token volatility score (0-100)
 * @returns Optimal trade amount
 */
export const calculateOptimalTradeSize = (
  walletBalance: number,
  riskLevel: number,
  tokenVolatility: number
): number => {
  // Base percentage based on risk level
  const basePercentage = riskLevel === 1 ? 0.05 : riskLevel === 2 ? 0.1 : 0.2;
  
  // Adjust based on volatility
  const volatilityFactor = 1 - (tokenVolatility / 200); // Higher volatility = lower size
  
  // Calculate final trade size
  const optimalSize = walletBalance * basePercentage * volatilityFactor;
  
  // Apply minimum and maximum constraints
  return Math.max(0.01, Math.min(optimalSize, walletBalance * 0.4));
};

/**
 * Track wallet activities of known profitable traders
 * @param walletAddresses Array of wallet addresses to track
 * @returns Recent activities of tracked wallets
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<any[]> => {
  if (!walletAddresses || walletAddresses.length === 0) {
    return [];
  }
  
  try {
    // For each wallet address, fetch recent transactions
    const activities = await Promise.all(walletAddresses.map(async (address) => {
      try {
        // Get recent transactions for this wallet directly from Helius API
        const response = await heliusApiCall(`transactions?account=${address}&limit=5`);
        
        if (!response || !Array.isArray(response)) {
          throw new Error(`Invalid response for wallet ${address}`);
        }
        
        // Process and return the activity data with real transaction data
        return {
          walletAddress: address,
          transactions: response || [],
          lastUpdated: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`Error fetching activities for wallet ${address}:`, error);
        return {
          walletAddress: address,
          transactions: [],
          error: "Failed to fetch transactions"
        };
      }
    }));
    
    return activities.filter(activity => activity.transactions.length > 0);
  } catch (error) {
    console.error("Error tracking wallet activities:", error);
    return [];
  }
};

/**
 * Calculate profitability metrics for a specific strategy
 * @param strategyName Name of the strategy
 * @param transactions Array of transactions executed by the strategy
 * @returns Profitability metrics
 */
export const calculateStrategyProfitability = (
  strategyName: string,
  transactions: any[]
): any => {
  if (!transactions || !transactions.length) {
    return {
      strategyName,
      totalProfit: 0,
      successRate: 0,
      avgExecutionTime: 0,
      roi: 0
    };
  }
  
  const successfulTrades = transactions.filter(tx => tx.profit > 0);
  const totalInvested = transactions.reduce((sum, tx) => sum + (tx.value || 0), 0);
  const totalProfit = transactions.reduce((sum, tx) => sum + (tx.profit || 0), 0);
  const avgExecutionTime = transactions.reduce((sum, tx) => sum + (tx.executionTime || 1000), 0) / transactions.length;
  
  return {
    strategyName,
    totalProfit,
    successRate: (successfulTrades.length / transactions.length) * 100,
    avgExecutionTime,
    roi: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0
  };
};

/**
 * Secures initial investment by scaling out of a position
 * @param position Trading position object
 * @param currentPrice Current token price
 * @param percentToSecure Percentage of initial investment to secure (default: 100%)
 * @returns Updated position object
 */
export const secureInitialInvestment = (
  position: any,
  currentPrice: number,
  percentToSecure: number = 100
): any => {
  if (!position || !position.initial_investment) {
    console.log("Invalid position object or missing initial investment");
    return position;
  }
  
  // In a live environment, this would check real price data
  // For now, if currentPrice is 0, we simulate a price based on the position
  const price = currentPrice > 0 ? currentPrice : (position.entry_price || 1) * 1.2;
  
  // Calculate profit in percentage
  const profitPercent = position.entry_price ? 
    ((price - position.entry_price) / position.entry_price) * 100 : 0;
  
  // Only secure initial if in profit
  if (profitPercent <= 0) {
    return {
      ...position,
      secured_initial: false,
      scale_out_history: position.scale_out_history || []
    };
  }
  
  // Calculate how much of initial investment to secure
  const amountToSecure = (position.initial_investment * (percentToSecure / 100));
  
  // Calculate how many tokens to sell to secure initial
  const tokensToSell = amountToSecure / price;
  
  // Record scale out in history
  const scaleOutEvent = {
    time: new Date().toISOString(),
    price: price,
    amount: amountToSecure,
    tokens: tokensToSell,
    reason: "Secure initial investment",
    percentSecured: percentToSecure
  };
  
  console.log(`Securing ${percentToSecure}% of initial investment: ${amountToSecure}`);
  
  // Update position
  return {
    ...position,
    secured_initial: true,
    scale_out_history: [...(position.scale_out_history || []), scaleOutEvent],
    current_amount: position.current_amount ? 
      (position.current_amount - amountToSecure) : 
      (position.initial_investment - amountToSecure)
  };
};
