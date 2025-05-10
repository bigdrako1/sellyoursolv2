// Risk management utilities for trading strategies
import { TradingPosition, ScaleOutEvent } from '@/types/token.types';

/**
 * Risk profile interface
 */
export interface RiskProfile {
  // Basic risk parameters
  maxPositionSize: number; // Maximum position size as percentage of portfolio
  maxDrawdown: number; // Maximum acceptable drawdown percentage
  maxRiskPerTrade: number; // Maximum risk per trade as percentage of portfolio
  volatilityTolerance: number; // Tolerance for volatility (1-100)
  correlationLimit: number; // Maximum correlation between positions (0-1)
  maxLeverage: number; // Maximum leverage to use

  // Advanced risk parameters
  riskToRewardMinimum?: number; // Minimum risk-to-reward ratio for new positions
  maxOpenPositions?: number; // Maximum number of open positions
  maxSectorExposure?: number; // Maximum exposure to a single market sector
  maxDailyLoss?: number; // Maximum daily loss percentage
  maxWeeklyLoss?: number; // Maximum weekly loss percentage
  maxMonthlyLoss?: number; // Maximum monthly loss percentage

  // Risk automation settings
  useAntiMartingale?: boolean; // Use anti-martingale position scaling
  useVolatilityFilters?: boolean; // Use volatility-based filters
  useCorrelationFilters?: boolean; // Use correlation filters
  usePositionSizing?: boolean; // Use automated position sizing
  useStopLoss?: boolean; // Use automated stop loss
  useTakeProfit?: boolean; // Use automated take profit
  useTrailingStop?: boolean; // Use automated trailing stop
}

/**
 * Position sizing model types
 */
export type PositionSizingModel =
  | 'fixed'
  | 'volatility_adjusted'
  | 'kelly_criterion'
  | 'optimal_f';

/**
 * Calculate optimal position size based on risk parameters
 * @param availableCapital Available capital for trading
 * @param riskPerTrade Risk per trade as percentage of capital
 * @param stopLossPercent Stop loss percentage
 * @param volatility Asset volatility (optional)
 * @param model Position sizing model to use
 * @returns Optimal position size
 */
export const calculatePositionSize = (
  availableCapital: number,
  riskPerTrade: number,
  stopLossPercent: number,
  volatility: number = 0,
  model: PositionSizingModel = 'volatility_adjusted'
): number => {
  // Base risk amount
  const riskAmount = availableCapital * (riskPerTrade / 100);

  // Calculate position size based on selected model
  switch (model) {
    case 'fixed':
      // Simple fixed percentage of capital at risk
      return riskAmount / (stopLossPercent / 100);

    case 'volatility_adjusted':
      // Adjust position size based on volatility
      const volatilityFactor = Math.max(0.2, 1 - (volatility / 100));
      return (riskAmount / (stopLossPercent / 100)) * volatilityFactor;

    case 'kelly_criterion':
      // Kelly Criterion (simplified version)
      // Assumes win rate of 50% and reward:risk ratio based on stop loss and take profit
      const winRate = 0.5; // Default win rate
      const rewardRiskRatio = 2; // Default reward:risk ratio
      const kellyFraction = Math.max(0, winRate - ((1 - winRate) / rewardRiskRatio));
      // Apply a fraction of Kelly to be more conservative (half-Kelly)
      const halfKelly = kellyFraction * 0.5;
      return availableCapital * halfKelly;

    case 'optimal_f':
      // Optimal f (simplified)
      // Uses a conservative fixed fraction approach
      return availableCapital * 0.1; // 10% of capital

    default:
      return riskAmount / (stopLossPercent / 100);
  }
};

/**
 * Calculate trailing stop loss price
 * @param entryPrice Entry price
 * @param currentPrice Current price
 * @param highestPrice Highest price since entry
 * @param trailingDistance Trailing distance percentage
 * @returns Trailing stop loss price
 */
export const calculateTrailingStopLoss = (
  entryPrice: number,
  currentPrice: number,
  highestPrice: number,
  trailingDistance: number
): number => {
  // Only activate trailing stop once we're in profit
  if (currentPrice <= entryPrice) {
    return entryPrice * (1 - (trailingDistance / 100));
  }

  // Calculate trailing stop based on highest price reached
  return highestPrice * (1 - (trailingDistance / 100));
};

/**
 * Dynamic scale-out strategy with multiple tiers
 * @param position Trading position
 * @param currentPrice Current price
 * @param customTiers Custom scale-out tiers (optional)
 * @returns Updated position with scale-outs applied
 */
export const dynamicScaleOutStrategy = (
  position: TradingPosition,
  currentPrice: number,
  customTiers?: { trigger: number; percent: number; reason: string }[]
): TradingPosition => {
  // Calculate profit percentage
  const profitPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

  // Use custom tiers if provided, otherwise use default tiers
  const scaleOutTiers = customTiers || [
    // Secure initial investment
    { trigger: 100, percent: 50, reason: "Secure initial investment at 2X" },
    // Scale out at 3X
    { trigger: 200, percent: 25, reason: "Scale out at 3X" },
    // Scale out at 5X
    { trigger: 400, percent: 50, reason: "Scale out at 5X" },
    // Scale out at 10X
    { trigger: 900, percent: 75, reason: "Scale out at 10X" }
  ];

  // Make a copy of the position to update
  let updatedPosition = { ...position };

  // Check if we've hit any scale-out tiers
  for (const tier of scaleOutTiers) {
    // Skip this tier if profit isn't high enough
    if (profitPercent < tier.trigger) continue;

    // Check if we've already done this scale-out tier by looking at reasons
    const alreadyScaledOut = updatedPosition.scaleOutHistory.some(
      event => event.reason.includes(tier.reason)
    );

    // Skip if already scaled out at this tier
    if (alreadyScaledOut) continue;

    // Calculate tokens owned originally
    const tokensOwned = updatedPosition.initialInvestment / updatedPosition.entryPrice;

    // Calculate tokens already sold
    const soldTokens = updatedPosition.scaleOutHistory.reduce((total, event) => total + event.tokens, 0);

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

    // Update position with this scale-out
    updatedPosition = {
      ...updatedPosition,
      scaleOutHistory: [...updatedPosition.scaleOutHistory, scaleOutEvent],
      notes: `${updatedPosition.notes}; ${tier.reason} at ${profitPercent.toFixed(2)}% profit (${new Date().toLocaleTimeString()})`
    };

    // Mark initial investment as secured if this is the first tier
    if (tier.trigger === 100) {
      updatedPosition.securedInitial = true;
    }
  }

  // Calculate current value excluding any sold tokens from scale-outs
  const tokensOwned = updatedPosition.initialInvestment / updatedPosition.entryPrice;
  const soldTokens = updatedPosition.scaleOutHistory.reduce((total, event) => total + event.tokens, 0);
  const remainingTokens = tokensOwned - soldTokens;
  const currentValue = remainingTokens * currentPrice;

  // Calculate total value recovered from scale-outs
  const recoveredValue = updatedPosition.scaleOutHistory.reduce((total, event) => total + event.amount, 0);

  // Calculate PnL and ROI
  const totalValue = currentValue + recoveredValue;
  const pnl = totalValue - updatedPosition.initialInvestment;
  const roi = (pnl / updatedPosition.initialInvestment) * 100;

  // Update position with current values
  return {
    ...updatedPosition,
    currentPrice,
    currentAmount: currentValue,
    lastUpdateTime: new Date().toISOString(),
    pnl,
    roi
  };
};

/**
 * Calculate portfolio risk metrics
 * @param positions Array of trading positions
 * @param totalPortfolioValue Total portfolio value
 * @returns Risk metrics
 */
export const calculatePortfolioRisk = (
  positions: TradingPosition[],
  totalPortfolioValue: number
) => {
  // Skip if no positions
  if (!positions.length) {
    return {
      totalRisk: 0,
      maxPositionRisk: 0,
      riskConcentration: 0,
      diversificationScore: 0
    };
  }

  // Calculate risk for each position
  const positionRisks = positions.map(position => {
    const positionValue = position.currentAmount;
    const positionRiskPercent = (positionValue / totalPortfolioValue) * 100;
    return {
      address: position.contractAddress,
      name: position.tokenName,
      symbol: position.tokenSymbol,
      value: positionValue,
      riskPercent: positionRiskPercent
    };
  });

  // Calculate total risk (sum of all position risks)
  const totalRisk = positionRisks.reduce((sum, pos) => sum + pos.riskPercent, 0);

  // Find maximum position risk
  const maxPositionRisk = Math.max(...positionRisks.map(pos => pos.riskPercent));

  // Calculate risk concentration (how much risk is concentrated in top positions)
  const sortedRisks = [...positionRisks].sort((a, b) => b.riskPercent - a.riskPercent);
  const topThreeRiskConcentration = sortedRisks.slice(0, 3).reduce((sum, pos) => sum + pos.riskPercent, 0);
  const riskConcentration = topThreeRiskConcentration / totalRisk;

  // Calculate diversification score (higher is better)
  const diversificationScore = Math.min(100, 100 - (riskConcentration * 100));

  return {
    totalRisk,
    maxPositionRisk,
    riskConcentration,
    diversificationScore,
    positionRisks
  };
};

/**
 * Calculate volatility of an asset based on price history
 * @param prices Array of historical prices
 * @param period Period to calculate volatility for (default: 14)
 * @returns Volatility as a percentage
 */
export const calculateVolatility = (
  prices: number[],
  period: number = 14
): number => {
  if (prices.length < period + 1) {
    return 0;
  }

  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] / prices[i - 1]) - 1);
  }

  // Calculate standard deviation of returns
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize volatility (assuming daily prices)
  const annualizedVolatility = stdDev * Math.sqrt(252);

  // Return as percentage
  return annualizedVolatility * 100;
};

/**
 * Calculate correlation between two assets
 * @param pricesA Prices of asset A
 * @param pricesB Prices of asset B
 * @returns Correlation coefficient (-1 to 1)
 */
export const calculateCorrelation = (
  pricesA: number[],
  pricesB: number[]
): number => {
  if (pricesA.length !== pricesB.length || pricesA.length < 2) {
    return 0;
  }

  // Calculate returns
  const returnsA = [];
  const returnsB = [];

  for (let i = 1; i < pricesA.length; i++) {
    returnsA.push((pricesA[i] / pricesA[i - 1]) - 1);
    returnsB.push((pricesB[i] / pricesB[i - 1]) - 1);
  }

  // Calculate means
  const meanA = returnsA.reduce((sum, ret) => sum + ret, 0) / returnsA.length;
  const meanB = returnsB.reduce((sum, ret) => sum + ret, 0) / returnsB.length;

  // Calculate covariance and variances
  let covariance = 0;
  let varianceA = 0;
  let varianceB = 0;

  for (let i = 0; i < returnsA.length; i++) {
    covariance += (returnsA[i] - meanA) * (returnsB[i] - meanB);
    varianceA += Math.pow(returnsA[i] - meanA, 2);
    varianceB += Math.pow(returnsB[i] - meanB, 2);
  }

  covariance /= returnsA.length;
  varianceA /= returnsA.length;
  varianceB /= returnsB.length;

  // Calculate correlation coefficient
  const correlation = covariance / (Math.sqrt(varianceA) * Math.sqrt(varianceB));

  return correlation;
};
