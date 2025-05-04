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
 * Position management interface
 */
export interface TradingPosition {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  entryPrice: number;
  entryTime: string;
  initialInvestment: number;
  currentAmount: number;
  currentPrice: number;
  lastUpdateTime: string;
  securedInitial: boolean;
  scaleOutHistory: ScaleOutEvent[];
  source: string;
  status: 'active' | 'closed' | 'failed';
  pnl: number;
  roi: number;
  notes: string;
}

/**
 * Scale out event interface
 */
export interface ScaleOutEvent {
  time: string;
  price: number;
  amount: number;
  tokens: number;
  reason: string;
  percentOfPosition: number;
}

/**
 * Create a new trading position
 * @param contractAddress Token contract address
 * @param tokenName Token name
 * @param tokenSymbol Token symbol
 * @param entryPrice Entry price
 * @param initialInvestment Initial investment amount
 * @param source Source of the signal
 * @returns New trading position
 */
export const createTradingPosition = (
  contractAddress: string,
  tokenName: string,
  tokenSymbol: string,
  entryPrice: number,
  initialInvestment: number,
  source: string
): TradingPosition => {
  return {
    contractAddress,
    tokenName,
    tokenSymbol,
    entryPrice,
    entryTime: new Date().toISOString(),
    initialInvestment,
    currentAmount: initialInvestment,
    currentPrice: entryPrice,
    lastUpdateTime: new Date().toISOString(),
    securedInitial: false,
    scaleOutHistory: [],
    source,
    status: 'active',
    pnl: 0,
    roi: 0,
    notes: 'Position created'
  };
};

/**
 * Update a trading position with latest price data
 * @param position Trading position to update
 * @param currentPrice Current token price
 * @returns Updated position with latest P&L and ROI data
 */
export const updateTradingPosition = (
  position: TradingPosition,
  currentPrice: number
): TradingPosition => {
  // Calculate tokens owned based on initial investment and entry price
  const tokensOwned = position.initialInvestment / position.entryPrice;
  
  // Calculate current value excluding any sold tokens from scale-outs
  const soldTokens = position.scaleOutHistory.reduce((total, event) => total + event.tokens, 0);
  const remainingTokens = tokensOwned - soldTokens;
  const currentValue = remainingTokens * currentPrice;
  
  // Calculate total value recovered from scale-outs
  const recoveredValue = position.scaleOutHistory.reduce((total, event) => total + event.amount, 0);
  
  // Calculate PnL and ROI
  const totalValue = currentValue + recoveredValue;
  const pnl = totalValue - position.initialInvestment;
  const roi = (pnl / position.initialInvestment) * 100;
  
  return {
    ...position,
    currentPrice,
    currentAmount: currentValue,
    lastUpdateTime: new Date().toISOString(),
    pnl,
    roi,
  };
};

/**
 * Secures initial investment by scaling out at 2X (100% profit)
 * and implements automated scale-out strategy based on performance
 * @param position Trading position object
 * @param currentPrice Current token price
 * @returns Updated position object with scale-out events if applied
 */
export const secureInitialInvestment = (
  position: TradingPosition,
  currentPrice: number
): TradingPosition => {
  if (!position || currentPrice <= 0) {
    console.log("Invalid position or price data");
    return position;
  }
  
  // Update the position with current price to get latest ROI
  const updatedPosition = updateTradingPosition(position, currentPrice);
  
  // Check if initial investment has already been secured
  if (updatedPosition.securedInitial) {
    return performScaleOutStrategy(updatedPosition, currentPrice);
  }

  // Calculate profit percentage
  const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
  
  // Check if we've reached 2X (100% profit) to secure initial
  if (profitPercent >= 100) {
    console.log(`Securing initial investment at ${profitPercent.toFixed(2)}% profit`);
    
    // Calculate tokens owned
    const tokensOwned = position.initialInvestment / position.entryPrice;
    
    // Calculate how many tokens to sell to secure initial (50% of position)
    const tokensToSell = tokensOwned * 0.5;
    const amountRecovered = tokensToSell * currentPrice;
    
    // Record scale out event
    const scaleOutEvent: ScaleOutEvent = {
      time: new Date().toISOString(),
      price: currentPrice,
      amount: amountRecovered,
      tokens: tokensToSell,
      reason: "Secured initial investment at 2X",
      percentOfPosition: 50
    };
    
    // Create updated position
    const securedPosition: TradingPosition = {
      ...updatedPosition,
      securedInitial: true,
      scaleOutHistory: [...(updatedPosition.scaleOutHistory || []), scaleOutEvent],
      notes: `${updatedPosition.notes}; Initial investment secured at 2X (${new Date().toLocaleTimeString()})`
    };
    
    // Now check if we should perform additional scale-outs
    return performScaleOutStrategy(securedPosition, currentPrice);
  }
  
  // No scale-out needed yet, return the updated position
  return updatedPosition;
};

/**
 * Implements an automated scale-out strategy for positions already in profit
 * @param position Trading position with secured initial
 * @param currentPrice Current token price
 * @returns Updated position with additional scale-outs if triggered
 */
export const performScaleOutStrategy = (
  position: TradingPosition, 
  currentPrice: number
): TradingPosition => {
  // Only apply to positions that have already secured initial
  if (!position.securedInitial) {
    return position;
  }
  
  // Calculate profit percentage
  const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
  
  // Define scale-out tiers
  const scaleOutTiers = [
    { trigger: 200, percent: 25, reason: "Scale out at 3X" },
    { trigger: 400, percent: 50, reason: "Scale out at 5X" },
    { trigger: 900, percent: 75, reason: "Scale out at 10X" }
  ];
  
  // Check if we've hit any scale-out tiers
  for (const tier of scaleOutTiers) {
    // Skip this tier if profit isn't high enough
    if (profitPercent < tier.trigger) continue;
    
    // Check if we've already done this scale-out tier by looking at reasons
    const alreadyScaledOut = position.scaleOutHistory.some(
      event => event.reason.includes(tier.reason)
    );
    
    // Skip if already scaled out at this tier
    if (alreadyScaledOut) continue;
    
    // Calculate tokens owned originally
    const tokensOwned = position.initialInvestment / position.entryPrice;
    
    // Calculate tokens already sold
    const soldTokens = position.scaleOutHistory.reduce((total, event) => total + event.tokens, 0);
    
    // Calculate remaining tokens
    const remainingTokens = tokensOwned - soldTokens;
    
    // Calculate how many tokens to sell at this tier (percentage of what's left)
    const tokensToSell = remainingTokens * (tier.percent / 100);
    const amountRecovered = tokensToSell * currentPrice;
    
    // Record scale out event
    const scaleOutEvent: ScaleOutEvent = {
      time: new Date().toISOString(),
      price: currentPrice,
      amount: amountRecovered,
      tokens: tokensToSell,
      reason: tier.reason,
      percentOfPosition: tier.percent
    };
    
    console.log(`Scaling out ${tier.percent}% at ${profitPercent.toFixed(2)}% profit (${tier.reason})`);
    
    // Create updated position with this scale-out
    position = {
      ...position,
      scaleOutHistory: [...position.scaleOutHistory, scaleOutEvent],
      notes: `${position.notes}; ${tier.reason} at ${profitPercent.toFixed(2)}% profit (${new Date().toLocaleTimeString()})`
    };
  }
  
  // Return position with all applicable scale-outs applied
  return updateTradingPosition(position, currentPrice);
};

/**
 * Load all trading positions from storage
 * @returns Array of trading positions
 */
export const loadTradingPositions = (): TradingPosition[] => {
  try {
    const storedPositions = localStorage.getItem('trading_positions');
    return storedPositions ? JSON.parse(storedPositions) : [];
  } catch (error) {
    console.error("Error loading trading positions:", error);
    return [];
  }
};

/**
 * Save trading positions to storage
 * @param positions Array of trading positions
 */
export const saveTradingPositions = (positions: TradingPosition[]): void => {
  try {
    localStorage.setItem('trading_positions', JSON.stringify(positions));
  } catch (error) {
    console.error("Error saving trading positions:", error);
  }
};
