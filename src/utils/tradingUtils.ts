
// Trading utilities for autonomous trading platform
import { getTokenPrices, heliusRpcCall, heliusApiCall } from './apiUtils';

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
};

/**
 * Executes a front-running trade
 * @param tokenSymbol Symbol of the token to trade
 * @param amount Amount to trade
 * @returns Transaction details
 */
export const executeFrontRunTrade = async (
  tokenSymbol: string, 
  amount: number
): Promise<any> => {
  try {
    // This would be replaced with actual blockchain transaction in production
    // For now, we'll simulate the transaction with parameters that would be used in a real call
    const transactionParams = {
      tokenSymbol,
      amount,
      chain: "solana",
      timestamp: new Date().toISOString()
    };
    
    // Mock transaction hash for development - would be replaced with actual TX hash in production
    const txHash = `${Math.random().toString(16).substr(2, 40)}`;
    
    // Return simulated transaction result
    return {
      ...transactionParams,
      success: true,
      executionTime: 1200, // in milliseconds
      gasFee: 0.00001, // Solana gas fee
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
  try {
    // For each wallet address, fetch recent transactions
    const activities = await Promise.all(walletAddresses.map(async (address) => {
      try {
        // Get recent transactions for this wallet
        const response = await heliusApiCall(`transactions?account=${address}&limit=5`);
        
        // Process and return the activity data
        return {
          walletAddress: address,
          transactions: response || [],
          lastUpdated: new Date().toISOString()
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
  if (!transactions.length) {
    return {
      strategyName,
      totalProfit: 0,
      successRate: 0,
      avgExecutionTime: 0,
      roi: 0
    };
  }
  
  const successfulTrades = transactions.filter(tx => tx.profit > 0);
  const totalInvested = transactions.reduce((sum, tx) => sum + tx.value, 0);
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
  if (!position || !position.entry_price || !position.initial_investment) {
    return position;
  }
  
  // Calculate profit in percentage
  const profitPercent = ((currentPrice - position.entry_price) / position.entry_price) * 100;
  
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
  const tokensToSell = amountToSecure / currentPrice;
  
  // Record scale out in history
  const scaleOutEvent = {
    time: new Date().toISOString(),
    price: currentPrice,
    amount: amountToSecure,
    tokens: tokensToSell,
    reason: "Secure initial investment"
  };
  
  // Update position
  return {
    ...position,
    secured_initial: true,
    scale_out_history: [...(position.scale_out_history || []), scaleOutEvent],
    current_amount: position.current_amount - amountToSecure
  };
};
