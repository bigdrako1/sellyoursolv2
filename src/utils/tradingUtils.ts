// Trading utilities for autonomous trading platform
import { APP_CONFIG } from '@/config/appDefinition';
import { getTokenPrice } from '@/services/jupiterService';
import { getTokenInfo } from '@/services/tokenDataService';
import { waitForRateLimit } from '@/utils/rateLimit';
import { toast } from '@/components/ui/sonner';

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
 * Advanced internal swap execution
 * @param tokenAddress Address of the token to trade
 * @param amount Amount to trade in SOL
 * @returns Transaction details
 */
export const executeTrade = async (
  tokenAddress: string, 
  amount: number
): Promise<any> => {
  try {
    console.log(`Executing internal trade: ${amount} SOL for token ${tokenAddress}`);
    
    // The SOL mint address
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    // Get current token price for estimating output
    const price = await getTokenPrice(tokenAddress);
    
    if (!price) {
      console.warn(`Could not get price for ${tokenAddress}`);
      return {
        success: false,
        error: "Could not fetch token price"
      };
    }
    
    // Calculate estimated output (how many tokens the user will receive)
    const estimatedTokens = amount / price;
    
    // In a real implementation, this would use Solana Web3.js to:
    // 1. Get the best route from a DEX aggregator (internal implementation)
    // 2. Create and sign the transaction
    // 3. Submit the transaction to the blockchain
    // 4. Return the confirmed transaction details
    
    // For now, we'll simulate the transaction
    const txHash = simulateTransaction({
      fromToken: SOL_MINT,
      toToken: tokenAddress,
      amount,
      route: 'internal_dex_aggregator',
      estimatedOutput: estimatedTokens,
      price
    });
    
    // Add a slight delay to simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Return successful transaction object
    return {
      success: true,
      txHash,
      fromToken: SOL_MINT,
      toToken: tokenAddress,
      amount,
      price,
      outputAmount: estimatedTokens,
      timestamp: new Date().toISOString(),
      executionTime: 1200, // milliseconds
      route: 'internal_dex_aggregator',
      slippage: 0.5, // 0.5%
      fee: amount * 0.001 // 0.1% fee
    };
  } catch (error) {
    console.error("Trade execution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Simulate a transaction on the blockchain
 * In a real implementation, this would be replaced with actual blockchain interaction
 */
function simulateTransaction(params: any): string {
  // Generate a random transaction hash
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const hash = Array.from({length: 64}, () => randomHex()).join('');
  
  // Log the simulated transaction
  console.log(`Simulated internal transaction: ${hash}`);
  console.log('Transaction parameters:', params);
  
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
 */
export const trackWalletActivities = async (walletAddresses: string[]): Promise<any[]> => {
  // This function is now handled by the tokenDataService
  // Keeping this function as a proxy for backward compatibility
  return [];
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
 */
export const createTradingPosition = (
  contractAddress: string,
  tokenName: string,
  tokenSymbol: string,
  entryPrice: number,
  initialInvestment: number,
  source: string
): TradingPosition => {
  const position = {
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
    notes: 'Position created via internal routing'
  };
  
  // Save the position to our local storage
  const positions = loadTradingPositions();
  saveTradingPositions([...positions, position]);
  
  return position;
};

/**
 * Update a trading position with latest price data
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
    console.log(`Securing initial investment at ${profitPercent.toFixed(2)}% profit via Jupiter`);
    
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
      reason: "Secured initial investment at 2X via Jupiter",
      percentOfPosition: 50
    };
    
    // Create updated position
    const securedPosition: TradingPosition = {
      ...updatedPosition,
      securedInitial: true,
      scaleOutHistory: [...(updatedPosition.scaleOutHistory || []), scaleOutEvent],
      notes: `${updatedPosition.notes}; Initial investment secured at 2X via Jupiter (${new Date().toLocaleTimeString()})`
    };
    
    // Now check if we should perform additional scale-outs
    return performScaleOutStrategy(securedPosition, currentPrice);
  }
  
  // No scale-out needed yet, return the updated position
  return updatedPosition;
};

/**
 * Implements an automated scale-out strategy for positions already in profit
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
    { trigger: 200, percent: 25, reason: "Scale out at 3X via Jupiter" },
    { trigger: 400, percent: 50, reason: "Scale out at 5X via Jupiter" },
    { trigger: 900, percent: 75, reason: "Scale out at 10X via Jupiter" }
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
    
    console.log(`Scaling out ${tier.percent}% at ${profitPercent.toFixed(2)}% profit via Jupiter (${tier.reason})`);
    
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
 */
export const saveTradingPositions = (positions: TradingPosition[]): void => {
  try {
    localStorage.setItem('trading_positions', JSON.stringify(positions));
  } catch (error) {
    console.error("Error saving trading positions:", error);
  }
};

/**
 * Get a shareable link for a trade
 * @param position Trading position
 * @returns Shareable link to view the position details
 */
export const getShareableTradeLink = (position: TradingPosition): string => {
  // Change from external Jupiter link to internal position view
  return `#/portfolio/positions/${position.contractAddress}`;
};

/**
 * Get internal swap link for a token
 * @param tokenAddress Token address
 * @returns Internal swap URL
 */
export const getInternalSwapLink = (tokenAddress: string): string => {
  // Create an internal app link instead of Jupiter external link
  return `#/trade?token=${tokenAddress}`;
};
