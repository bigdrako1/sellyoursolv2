// Advanced Backtesting Framework for Trading Strategies
import { TradingPosition, ScaleOutEvent } from '@/types/token.types';
import { calculateStrategyProfitability } from '@/utils/tradingUtils';
import { fetchHistoricalData } from '@/services/marketDataService';

/**
 * Strategy type definition
 */
export type StrategyType =
  | 'trend_following'
  | 'mean_reversion'
  | 'breakout'
  | 'momentum'
  | 'volatility'
  | 'smart_money'
  | 'custom';

/**
 * Market condition type
 */
export type MarketCondition =
  | 'bull'
  | 'bear'
  | 'sideways'
  | 'volatile'
  | 'low_volatility';

/**
 * Historical price data interface
 */
export interface HistoricalPriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Backtesting configuration interface
 */
export interface BacktestConfig {
  // Basic configuration
  strategyName: string;
  strategyType: StrategyType;
  initialCapital: number;
  startDate: string;
  endDate: string;

  // Trading costs
  feePercentage: number;
  slippagePercentage: number;

  // Risk management
  enableTrailingStopLoss: boolean;
  trailingStopLossDistance: number;
  secureInitial: boolean;
  secureInitialThreshold: number;
  takeProfit: number;
  stopLoss: number;
  maxPositions: number;
  maxPositionSize: number;
  riskPerTrade: number;

  // Advanced options
  enableScaleOut: boolean;
  scaleOutLevels?: { percentage: number, amount: number }[];
  reinvestProfits: boolean;
  enableVolatilityAdjustment: boolean;
  volatilityLookback?: number;

  // Market condition filters
  marketConditionFilter?: MarketCondition[];

  // Optimization parameters
  optimizationTarget?: 'sharpe' | 'sortino' | 'total_return' | 'max_drawdown' | 'profit_factor';
}

/**
 * Backtesting result interface
 */
export interface BacktestResult {
  // Basic information
  strategyName: string;
  strategyType: StrategyType;
  initialCapital: number;
  finalCapital: number;

  // Return metrics
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;

  // Trade data
  trades: BacktestTrade[];
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;

  // Performance metrics
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  averageHoldingPeriod: number;
  profitFactor: number;
  expectancy: number;

  // Risk metrics
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  maxDrawdownDuration: number;
  recoveryFactor: number;
  calmarRatio: number;
  sharpeRatio: number;
  sortinoRatio: number;

  // Market timing metrics
  marketExposure: number;
  timeInMarket: number;

  // Volatility metrics
  returnVolatility: number;
  downsideDeviation: number;

  // Data series for charts
  dailyReturns: { date: string; return: number }[];
  equityCurve: { date: string; equity: number }[];
  drawdownCurve: { date: string; drawdown: number }[];

  // Monthly and yearly breakdowns
  monthlyReturns: { month: string; return: number }[];
  yearlyReturns: { year: string; return: number }[];

  // Market condition performance
  marketConditionPerformance?: {
    condition: MarketCondition;
    returnPercentage: number;
    winRate: number;
    trades: number;
  }[];
}

/**
 * Backtesting trade interface
 */
export interface BacktestTrade {
  // Basic trade information
  entryDate: string;
  exitDate: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;

  // Performance metrics
  pnl: number;
  pnlPercentage: number;

  // Trading costs
  fees: number;
  slippage: number;
  totalCosts: number;

  // Trade duration
  holdingPeriod: number;
  holdingPeriodDays?: number;

  // Exit information
  exitReason: 'take_profit' | 'stop_loss' | 'trailing_stop' | 'end_of_period' | 'manual' | 'scale_out' | 'volatility_exit';

  // Advanced trade data
  entrySignalStrength?: number;
  exitSignalStrength?: number;
  marketConditionAtEntry?: MarketCondition;
  marketConditionAtExit?: MarketCondition;
  volatilityAtEntry?: number;
  volatilityAtExit?: number;

  // Risk metrics
  riskRewardRatio?: number;
  riskAmount?: number;
  rewardAmount?: number;

  // Scale out information
  scaleOutEvents: ScaleOutEvent[];

  // Trade notes
  notes?: string;
}

/**
 * Load historical price data for backtesting
 * @param symbol Token symbol
 * @param startDate Start date in ISO format
 * @param endDate End date in ISO format
 * @param timeframe Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
 */
export const loadHistoricalData = async (
  symbol: string,
  startDate: string,
  endDate: string,
  timeframe: string = '1h'
): Promise<HistoricalPriceData[]> => {
  try {
    // Use the market data service to fetch real historical data
    const data = await fetchHistoricalData(symbol, startDate, endDate, timeframe);

    // Map the data to our HistoricalPriceData format
    return data.map(item => ({
      timestamp: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  } catch (error) {
    console.error("Error loading historical data:", error);

    // Fallback to synthetic data if API fails
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Determine time increment based on timeframe
    let increment = 3600000; // 1 hour in milliseconds
    switch (timeframe) {
      case '1m': increment = 60000; break;
      case '5m': increment = 300000; break;
      case '15m': increment = 900000; break;
      case '1h': increment = 3600000; break;
      case '4h': increment = 14400000; break;
      case '1d': increment = 86400000; break;
    }

    const data: HistoricalPriceData[] = [];
    let currentPrice = 1.0; // Starting price
    let currentTime = start;

    while (currentTime <= end) {
      // Generate random price movement (more realistic than pure random)
      const volatility = 0.02; // 2% volatility
      const rnd = Math.random() - 0.5;
      const changePercent = 2 * volatility * rnd;
      const changeAmount = currentPrice * changePercent;

      // Calculate OHLC
      const open = currentPrice;
      currentPrice = open + changeAmount;
      const close = currentPrice;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);

      // Generate volume (correlated with price change)
      const volume = 1000000 * (1 + Math.abs(changePercent) * 10);

      data.push({
        timestamp: new Date(currentTime).toISOString(),
        open,
        high,
        low,
        close,
        volume
      });

      currentTime += increment;
    }

    return data;
  }
};

/**
 * Run backtest for a specific strategy
 * @param config Backtest configuration
 * @param historicalData Historical price data
 * @param strategyFunction Strategy function that generates signals
 */
export const runBacktest = (
  config: BacktestConfig,
  historicalData: HistoricalPriceData[],
  strategyFunction: (data: HistoricalPriceData[], index: number) => 'buy' | 'sell' | 'hold'
): BacktestResult => {
  // Initialize backtest state
  let capital = config.initialCapital;
  let positions: BacktestTrade[] = [];
  let completedTrades: BacktestTrade[] = [];
  let equityCurve: { date: string; equity: number }[] = [];
  let highWaterMark = capital;
  let maxDrawdown = 0;

  // Initialize equity curve with initial capital for all data points
  equityCurve = historicalData.map(candle => ({
    date: candle.timestamp,
    equity: config.initialCapital
  }));

  // Process each candle
  for (let i = 50; i < historicalData.length; i++) { // Start at 50 to have enough data for indicators
    const currentCandle = historicalData[i];
    const currentDate = currentCandle.timestamp;
    const currentPrice = currentCandle.close;

    // Update equity for this data point
    const openPositionsValue = positions.reduce(
      (sum, pos) => sum + (pos.quantity * currentPrice),
      0
    );
    const currentEquity = capital + openPositionsValue;
    equityCurve[i].equity = currentEquity;

    // Update drawdown
    if (currentEquity > highWaterMark) {
      highWaterMark = currentEquity;
    }
    const currentDrawdown = highWaterMark - currentEquity;
    const currentDrawdownPct = (currentDrawdown / highWaterMark) * 100;
    if (currentDrawdownPct > maxDrawdown) {
      maxDrawdown = currentDrawdownPct;
    }

    // Check for exit conditions on open positions
    positions = positions.map(position => {
      // Check stop loss
      if (currentPrice <= position.entryPrice * (1 - config.stopLoss / 100)) {
        const exitTrade = {
          ...position,
          exitDate: currentDate,
          exitPrice: currentPrice,
          pnl: (currentPrice - position.entryPrice) * position.quantity - position.fees,
          pnlPercentage: ((currentPrice / position.entryPrice) - 1) * 100,
          exitReason: 'stop_loss' as const
        };
        completedTrades.push(exitTrade);
        capital += exitTrade.exitPrice * position.quantity - (exitTrade.exitPrice * position.quantity * config.feePercentage / 100);
        return null;
      }

      // Check take profit
      if (currentPrice >= position.entryPrice * (1 + config.takeProfit / 100)) {
        const exitTrade = {
          ...position,
          exitDate: currentDate,
          exitPrice: currentPrice,
          pnl: (currentPrice - position.entryPrice) * position.quantity - position.fees,
          pnlPercentage: ((currentPrice / position.entryPrice) - 1) * 100,
          exitReason: 'take_profit' as const
        };
        completedTrades.push(exitTrade);
        capital += exitTrade.exitPrice * position.quantity - (exitTrade.exitPrice * position.quantity * config.feePercentage / 100);
        return null;
      }

      // Check trailing stop if enabled
      if (config.enableTrailingStopLoss) {
        const highestSinceEntry = Math.max(
          ...historicalData
            .slice(historicalData.findIndex(candle => candle.timestamp === position.entryDate), i + 1)
            .map(candle => candle.high)
        );

        if (currentPrice <= highestSinceEntry * (1 - config.trailingStopLossDistance / 100)) {
          const exitTrade = {
            ...position,
            exitDate: currentDate,
            exitPrice: currentPrice,
            pnl: (currentPrice - position.entryPrice) * position.quantity - position.fees,
            pnlPercentage: ((currentPrice / position.entryPrice) - 1) * 100,
            exitReason: 'trailing_stop' as const
          };
          completedTrades.push(exitTrade);
          capital += exitTrade.exitPrice * position.quantity - (exitTrade.exitPrice * position.quantity * config.feePercentage / 100);
          return null;
        }
      }

      return position;
    }).filter(Boolean);

    // Get strategy signal
    const signal = strategyFunction(historicalData.slice(0, i + 1), i);

    // Execute buy signal if we have capital and fewer than max positions
    if (signal === 'buy' && positions.length < config.maxPositions && capital > 0) {
      // Calculate position size based on risk
      const riskAmount = config.initialCapital * (config.riskPerTrade / 100);
      const maxLoss = config.stopLoss / 100;
      const positionSize = Math.min(
        riskAmount / maxLoss,
        capital * (config.maxPositionSize / 100)
      );

      // Calculate quantity and fees
      const quantity = positionSize / currentPrice;
      const fees = positionSize * (config.feePercentage / 100);

      // Create new position
      const newPosition: BacktestTrade = {
        entryDate: currentDate,
        exitDate: null,
        symbol: 'BACKTEST',
        entryPrice: currentPrice,
        exitPrice: null,
        quantity,
        pnl: null,
        pnlPercentage: null,
        fees,
        slippage: positionSize * (config.slippagePercentage / 100),
        holdingPeriod: null,
        exitReason: null,
        scaleOutEvents: []
      };

      // Add position and deduct capital
      positions.push(newPosition);
      capital -= positionSize + fees;
    }
  }

  // Close any remaining positions at the end of the backtest
  const finalCandle = historicalData[historicalData.length - 1];
  const finalPositions = positions.map(position => ({
    ...position,
    exitDate: finalCandle.timestamp,
    exitPrice: finalCandle.close,
    pnl: (finalCandle.close - position.entryPrice) * position.quantity - position.fees,
    pnlPercentage: ((finalCandle.close / position.entryPrice) - 1) * 100,
    holdingPeriod: new Date(finalCandle.timestamp).getTime() - new Date(position.entryDate).getTime(),
    exitReason: 'end_of_period' as const
  }));

  completedTrades = [...completedTrades, ...finalPositions];

  // Calculate final capital
  const finalCapital = capital + finalPositions.reduce(
    (sum, pos) => sum + (pos.quantity * pos.exitPrice),
    0
  );

  // Calculate performance metrics
  const winningTrades = completedTrades.filter(trade => trade.pnl > 0);
  const losingTrades = completedTrades.filter(trade => trade.pnl <= 0);

  // Handle case when there are no trades
  const winRate = completedTrades.length > 0
    ? winningTrades.length / completedTrades.length * 100
    : 0;

  const averageWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, trade) => sum + trade.pnlPercentage, 0) / winningTrades.length
    : 0;

  const averageLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, trade) => sum + trade.pnlPercentage, 0) / losingTrades.length
    : 0;

  // Calculate largest win and loss
  const largestWin = winningTrades.length > 0
    ? Math.max(...winningTrades.map(trade => trade.pnlPercentage))
    : 0;

  const largestLoss = losingTrades.length > 0
    ? Math.min(...losingTrades.map(trade => trade.pnlPercentage))
    : 0;

  // Calculate average holding period
  const averageHoldingPeriod = completedTrades.length > 0
    ? completedTrades.reduce((sum, trade) => {
        const holdingPeriodMs = new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime();
        const holdingPeriodDays = holdingPeriodMs / (1000 * 60 * 60 * 24);
        return sum + holdingPeriodDays;
      }, 0) / completedTrades.length
    : 0;

  // Calculate profit factor
  const profitFactor = losingTrades.length > 0 && winningTrades.length > 0
    ? Math.abs(winningTrades.reduce((sum, trade) => sum + trade.pnl, 0) /
      losingTrades.reduce((sum, trade) => sum + trade.pnl, 0))
    : winningTrades.length > 0 ? Infinity : 0;

  // Calculate expectancy
  const expectancy = completedTrades.length > 0
    ? (winRate / 100 * averageWin) + ((100 - winRate) / 100 * averageLoss)
    : 0;

  // Calculate daily returns for Sharpe and Sortino ratios
  const dailyReturns = calculateDailyReturns(equityCurve);
  const returnsArray = dailyReturns.map(day => day.return);
  const sharpeRatio = calculateSharpeRatio(returnsArray);
  const sortinoRatio = calculateSortinoRatio(returnsArray);

  // Calculate return volatility
  const returnVolatility = calculateVolatility(returnsArray);

  // Calculate downside deviation
  const downsideDeviation = calculateDownsideDeviation(returnsArray);

  // Calculate max drawdown duration
  const maxDrawdownDuration = calculateMaxDrawdownDuration(equityCurve);

  // Calculate recovery factor
  const recoveryFactor = finalCapital > config.initialCapital && maxDrawdown > 0
    ? (finalCapital - config.initialCapital) / (config.initialCapital * (maxDrawdown / 100))
    : 0;

  // Calculate Calmar ratio
  const annualizedReturn = calculateAnnualizedReturn(config.initialCapital, finalCapital, historicalData);
  const calmarRatio = maxDrawdown > 0 ? annualizedReturn / (maxDrawdown / 100) : 0;

  // Calculate market exposure
  const timeInMarket = completedTrades.reduce((sum, trade) => {
    const entryTime = new Date(trade.entryDate).getTime();
    const exitTime = new Date(trade.exitDate).getTime();
    return sum + (exitTime - entryTime);
  }, 0);

  const totalBacktestTime = new Date(historicalData[historicalData.length - 1].timestamp).getTime() -
                           new Date(historicalData[0].timestamp).getTime();

  const marketExposure = totalBacktestTime > 0 ? (timeInMarket / totalBacktestTime) * 100 : 0;

  // Calculate monthly and yearly returns
  const monthlyReturns = calculateMonthlyReturns(equityCurve);
  const yearlyReturns = calculateYearlyReturns(equityCurve);

  // Calculate market condition performance if market conditions are provided
  const marketConditionPerformance = calculateMarketConditionPerformance(completedTrades);

  // Calculate drawdown curve
  const drawdownCurve = calculateDrawdownCurve(equityCurve);

  return {
    // Basic information
    strategyName: config.strategyName,
    strategyType: config.strategyType || 'custom',
    initialCapital: config.initialCapital,
    finalCapital,

    // Return metrics
    totalReturn: finalCapital - config.initialCapital,
    totalReturnPercentage: (finalCapital / config.initialCapital - 1) * 100,
    annualizedReturn,

    // Trade data
    trades: completedTrades,
    totalTrades: completedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,

    // Performance metrics
    winRate,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    averageHoldingPeriod,
    profitFactor,
    expectancy,

    // Risk metrics
    maxDrawdown,
    maxDrawdownPercentage: maxDrawdown,
    maxDrawdownDuration,
    recoveryFactor,
    calmarRatio,
    sharpeRatio,
    sortinoRatio,

    // Market timing metrics
    marketExposure,
    timeInMarket,

    // Volatility metrics
    returnVolatility,
    downsideDeviation,

    // Data series for charts
    dailyReturns,
    equityCurve,
    drawdownCurve,

    // Monthly and yearly breakdowns
    monthlyReturns,
    yearlyReturns,

    // Market condition performance
    marketConditionPerformance
  };
};

/**
 * Calculate daily returns from equity curve
 */
const calculateDailyReturns = (equityCurve: { date: string; equity: number }[]): { date: string; return: number }[] => {
  const dailyReturns = [];

  for (let i = 1; i < equityCurve.length; i++) {
    const previousEquity = equityCurve[i-1].equity;
    const currentEquity = equityCurve[i].equity;
    const dailyReturn = (currentEquity / previousEquity) - 1;

    dailyReturns.push({
      date: equityCurve[i].date,
      return: dailyReturn
    });
  }

  return dailyReturns;
};

/**
 * Calculate drawdown curve from equity curve
 */
const calculateDrawdownCurve = (equityCurve: { date: string; equity: number }[]): { date: string; drawdown: number }[] => {
  // Handle empty equity curve
  if (!equityCurve || equityCurve.length === 0) {
    return [];
  }

  let highWaterMark = equityCurve[0].equity;

  return equityCurve.map(point => {
    if (point.equity > highWaterMark) {
      highWaterMark = point.equity;
    }

    const drawdown = (highWaterMark - point.equity) / highWaterMark * 100;

    return {
      date: point.date,
      drawdown
    };
  });
};

/**
 * Calculate Sharpe ratio
 */
const calculateSharpeRatio = (returns: number[]): number => {
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  // Annualize (assuming daily returns)
  const annualizedMean = mean * 252;
  const annualizedStdDev = stdDev * Math.sqrt(252);

  // Risk-free rate (assume 0 for simplicity)
  const riskFreeRate = 0;

  return (annualizedMean - riskFreeRate) / annualizedStdDev;
};

/**
 * Calculate Sortino ratio (only considers downside deviation)
 */
const calculateSortinoRatio = (returns: number[]): number => {
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

  // Only consider negative returns for downside deviation
  const negativeReturns = returns.filter(ret => ret < 0);
  const downsideVariance = negativeReturns.length > 0
    ? negativeReturns.reduce((sum, ret) => sum + Math.pow(ret - 0, 2), 0) / negativeReturns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // Annualize (assuming daily returns)
  const annualizedMean = mean * 252;
  const annualizedDownsideDeviation = downsideDeviation * Math.sqrt(252);

  // Risk-free rate (assume 0 for simplicity)
  const riskFreeRate = 0;

  return annualizedDownsideDeviation === 0
    ? Infinity
    : (annualizedMean - riskFreeRate) / annualizedDownsideDeviation;
};

/**
 * Calculate annualized return
 */
const calculateAnnualizedReturn = (
  initialCapital: number,
  finalCapital: number,
  historicalData: HistoricalPriceData[]
): number => {
  const startDate = new Date(historicalData[0].timestamp);
  const endDate = new Date(historicalData[historicalData.length - 1].timestamp);
  const yearFraction = (endDate.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);

  return Math.pow(finalCapital / initialCapital, 1 / yearFraction) - 1;
};

/**
 * Calculate volatility of returns
 * @param returns Array of returns
 * @returns Volatility
 */
const calculateVolatility = (returns: number[]): number => {
  if (returns.length <= 1) return 0;

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);

  return Math.sqrt(variance);
};

/**
 * Calculate downside deviation
 * @param returns Array of returns
 * @param threshold Minimum acceptable return (default: 0)
 * @returns Downside deviation
 */
const calculateDownsideDeviation = (returns: number[], threshold = 0): number => {
  if (returns.length === 0) return 0;

  const belowThreshold = returns.filter(ret => ret < threshold);

  if (belowThreshold.length === 0) return 0;

  const sumSquaredDeviations = belowThreshold.reduce(
    (sum, ret) => sum + Math.pow(ret - threshold, 2),
    0
  );

  return Math.sqrt(sumSquaredDeviations / belowThreshold.length);
};

/**
 * Calculate maximum drawdown duration in days
 * @param equityCurve Equity curve
 * @returns Maximum drawdown duration in days
 */
const calculateMaxDrawdownDuration = (equityCurve: { date: string; equity: number }[]): number => {
  if (equityCurve.length <= 1) return 0;

  let maxDuration = 0;
  let currentDuration = 0;
  let highWatermark = equityCurve[0].equity;
  let drawdownStart: Date | null = null;

  for (let i = 1; i < equityCurve.length; i++) {
    const currentEquity = equityCurve[i].equity;

    if (currentEquity >= highWatermark) {
      // New high water mark
      highWatermark = currentEquity;

      if (drawdownStart) {
        // End of drawdown period
        const drawdownEnd = new Date(equityCurve[i].date);
        const durationDays = (drawdownEnd.getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24);

        if (durationDays > maxDuration) {
          maxDuration = durationDays;
        }

        drawdownStart = null;
        currentDuration = 0;
      }
    } else if (!drawdownStart) {
      // Start of drawdown period
      drawdownStart = new Date(equityCurve[i-1].date);
    }
  }

  // Check if we're still in a drawdown at the end of the period
  if (drawdownStart) {
    const lastDate = new Date(equityCurve[equityCurve.length - 1].date);
    const durationDays = (lastDate.getTime() - drawdownStart.getTime()) / (1000 * 60 * 60 * 24);

    if (durationDays > maxDuration) {
      maxDuration = durationDays;
    }
  }

  return maxDuration;
};

/**
 * Calculate monthly returns from equity curve
 * @param equityCurve Equity curve
 * @returns Array of monthly returns
 */
const calculateMonthlyReturns = (equityCurve: { date: string; equity: number }[]): { month: string; return: number }[] => {
  if (equityCurve.length <= 1) return [];

  const monthlyData: { [key: string]: { startEquity: number; endEquity: number } } = {};

  equityCurve.forEach(point => {
    const date = new Date(point.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { startEquity: point.equity, endEquity: point.equity };
    } else {
      monthlyData[monthKey].endEquity = point.equity;
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    return: (data.endEquity / data.startEquity - 1) * 100
  }));
};

/**
 * Calculate yearly returns from equity curve
 * @param equityCurve Equity curve
 * @returns Array of yearly returns
 */
const calculateYearlyReturns = (equityCurve: { date: string; equity: number }[]): { year: string; return: number }[] => {
  if (equityCurve.length <= 1) return [];

  const yearlyData: { [key: string]: { startEquity: number; endEquity: number } } = {};

  equityCurve.forEach(point => {
    const date = new Date(point.date);
    const yearKey = `${date.getFullYear()}`;

    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = { startEquity: point.equity, endEquity: point.equity };
    } else {
      yearlyData[yearKey].endEquity = point.equity;
    }
  });

  return Object.entries(yearlyData).map(([year, data]) => ({
    year,
    return: (data.endEquity / data.startEquity - 1) * 100
  }));
};

/**
 * Calculate performance metrics by market condition
 * @param trades Array of completed trades
 * @returns Performance metrics by market condition
 */
const calculateMarketConditionPerformance = (trades: BacktestTrade[]): {
  condition: MarketCondition;
  returnPercentage: number;
  winRate: number;
  trades: number;
}[] | undefined => {
  // Group trades by market condition at entry
  const tradesByCondition: { [key in MarketCondition]?: BacktestTrade[] } = {};

  trades.forEach(trade => {
    if (trade.marketConditionAtEntry) {
      if (!tradesByCondition[trade.marketConditionAtEntry]) {
        tradesByCondition[trade.marketConditionAtEntry] = [];
      }
      tradesByCondition[trade.marketConditionAtEntry]?.push(trade);
    }
  });

  // If no market conditions are available, return undefined
  if (Object.keys(tradesByCondition).length === 0) {
    return undefined;
  }

  // Calculate performance metrics for each market condition
  return Object.entries(tradesByCondition).map(([condition, conditionTrades]) => {
    const totalPnlPercentage = conditionTrades.reduce((sum, trade) => sum + trade.pnlPercentage, 0);
    const winningTrades = conditionTrades.filter(trade => trade.pnl > 0);
    const winRate = conditionTrades.length > 0 ? (winningTrades.length / conditionTrades.length) * 100 : 0;

    return {
      condition: condition as MarketCondition,
      returnPercentage: totalPnlPercentage,
      winRate,
      trades: conditionTrades.length
    };
  });
};

/**
 * Monte Carlo simulation interface
 */
export interface MonteCarloSimulation {
  // Simulation parameters
  iterations: number;
  confidenceInterval: number;

  // Simulation results
  results: {
    iteration: number;
    finalCapital: number;
    maxDrawdown: number;
    totalReturn: number;
    sharpeRatio: number;
  }[];

  // Statistical analysis
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
    confidenceLowerBound: number;
    confidenceUpperBound: number;
    worstDrawdown: number;
    bestReturn: number;
    worstReturn: number;
  };

  // Percentile distribution
  percentiles: {
    percentile: number;
    value: number;
  }[];
}

/**
 * Parameter optimization result interface
 */
export interface ParameterOptimizationResult {
  // Best parameters found
  bestParameters: Record<string, any>;

  // Performance of best parameters
  performance: {
    finalCapital: number;
    totalReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    sortinoRatio: number;
    winRate: number;
    profitFactor: number;
  };

  // All tested parameter combinations
  allResults: {
    parameters: Record<string, any>;
    performance: {
      finalCapital: number;
      totalReturn: number;
      maxDrawdown: number;
      sharpeRatio: number;
    };
  }[];

  // Sensitivity analysis
  parameterSensitivity: {
    parameter: string;
    sensitivity: number;
  }[];
}

/**
 * Run Monte Carlo simulation on a backtest
 * @param baseResult Base backtest result
 * @param historicalData Historical price data
 * @param iterations Number of iterations to run
 * @param confidenceInterval Confidence interval (0-1)
 * @param randomizationMethod Method to randomize trades
 * @returns Monte Carlo simulation results
 */
export const runMonteCarloSimulation = (
  baseResult: BacktestResult,
  historicalData: HistoricalPriceData[],
  iterations: number = 1000,
  confidenceInterval: number = 0.95,
  randomizationMethod: 'shuffle' | 'bootstrap' | 'random_sequence' = 'shuffle'
): MonteCarloSimulation => {
  // Extract trades from base result
  const trades = baseResult.trades;

  // Initialize results array
  const results: MonteCarloSimulation['results'] = [];

  // Run iterations
  for (let i = 0; i < iterations; i++) {
    // Create a randomized sequence of trades based on the selected method
    let randomizedTrades: BacktestTrade[];

    switch (randomizationMethod) {
      case 'shuffle':
        // Randomly shuffle the order of trades
        randomizedTrades = [...trades].sort(() => Math.random() - 0.5);
        break;

      case 'bootstrap':
        // Resample trades with replacement
        randomizedTrades = Array(trades.length).fill(null).map(() =>
          trades[Math.floor(Math.random() * trades.length)]
        );
        break;

      case 'random_sequence':
        // Generate a new random sequence of wins and losses based on win rate
        const winRate = baseResult.winRate / 100;
        randomizedTrades = trades.map(trade => {
          const isWin = Math.random() < winRate;

          // Use average win/loss values from original backtest
          const pnlPercentage = isWin ? baseResult.averageWin : baseResult.averageLoss;

          return {
            ...trade,
            pnl: (trade.entryPrice * (pnlPercentage / 100)) * trade.quantity,
            pnlPercentage
          };
        });
        break;
    }

    // Simulate equity curve with randomized trades
    let equity = baseResult.initialCapital;
    let highWaterMark = equity;
    let maxDrawdown = 0;

    const equityCurve: { date: string; equity: number }[] = [];

    randomizedTrades.forEach(trade => {
      // Apply trade P&L to equity
      equity += trade.pnl;
      equityCurve.push({ date: trade.exitDate, equity });

      // Update drawdown
      if (equity > highWaterMark) {
        highWaterMark = equity;
      }

      const drawdown = (highWaterMark - equity) / highWaterMark * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    // Calculate returns for Sharpe ratio
    const returns = equityCurve.map((point, i, arr) =>
      i > 0 ? (point.equity / arr[i-1].equity) - 1 : 0
    ).slice(1);

    // Calculate Sharpe ratio
    const sharpeRatio = calculateSharpeRatio(returns);

    // Calculate total return
    const totalReturn = (equity / baseResult.initialCapital - 1) * 100;

    // Store results
    results.push({
      iteration: i + 1,
      finalCapital: equity,
      maxDrawdown,
      totalReturn,
      sharpeRatio
    });
  }

  // Sort results by final capital
  results.sort((a, b) => a.finalCapital - b.finalCapital);

  // Calculate statistics
  const finalCapitals = results.map(r => r.finalCapital);
  const totalReturns = results.map(r => r.totalReturn);
  const maxDrawdowns = results.map(r => r.maxDrawdown);

  const mean = finalCapitals.reduce((sum, val) => sum + val, 0) / finalCapitals.length;
  const median = finalCapitals[Math.floor(finalCapitals.length / 2)];
  const min = finalCapitals[0];
  const max = finalCapitals[finalCapitals.length - 1];

  // Calculate standard deviation
  const variance = finalCapitals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / finalCapitals.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate confidence interval bounds
  const lowerPercentile = (1 - confidenceInterval) / 2;
  const upperPercentile = 1 - lowerPercentile;

  const confidenceLowerBound = finalCapitals[Math.floor(lowerPercentile * finalCapitals.length)];
  const confidenceUpperBound = finalCapitals[Math.floor(upperPercentile * finalCapitals.length)];

  // Find worst drawdown, best and worst returns
  const worstDrawdown = Math.max(...maxDrawdowns);
  const bestReturn = Math.max(...totalReturns);
  const worstReturn = Math.min(...totalReturns);

  // Calculate percentiles
  const percentiles = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95].map(percentile => ({
    percentile: percentile * 100,
    value: finalCapitals[Math.floor(percentile * finalCapitals.length)]
  }));

  return {
    iterations,
    confidenceInterval,
    results,
    statistics: {
      mean,
      median,
      min,
      max,
      standardDeviation,
      confidenceLowerBound,
      confidenceUpperBound,
      worstDrawdown,
      bestReturn,
      worstReturn
    },
    percentiles
  };
};

/**
 * Optimize strategy parameters
 * @param baseConfig Base backtest configuration
 * @param historicalData Historical price data
 * @param strategyFunction Strategy function
 * @param parameterRanges Parameter ranges to test
 * @param optimizationTarget Metric to optimize
 * @returns Optimization results
 */
export const optimizeParameters = async (
  baseConfig: BacktestConfig,
  historicalData: HistoricalPriceData[],
  strategyFunction: (data: HistoricalPriceData[], index: number, params: Record<string, any>) => 'buy' | 'sell' | 'hold',
  parameterRanges: Record<string, { min: number; max: number; step: number }>,
  optimizationTarget: 'sharpe' | 'sortino' | 'total_return' | 'max_drawdown' | 'profit_factor' = 'sharpe'
): Promise<ParameterOptimizationResult> => {
  // Generate all parameter combinations
  const parameterCombinations = generateParameterCombinations(parameterRanges);

  // Initialize results array
  const allResults: ParameterOptimizationResult['allResults'] = [];

  // Run backtest for each parameter combination
  for (const parameters of parameterCombinations) {
    // Create modified strategy function with current parameters
    const parameterizedStrategy = (data: HistoricalPriceData[], index: number) =>
      strategyFunction(data, index, parameters);

    // Run backtest with current parameters
    const result = runBacktest(baseConfig, historicalData, parameterizedStrategy);

    // Store results
    allResults.push({
      parameters,
      performance: {
        finalCapital: result.finalCapital,
        totalReturn: result.totalReturnPercentage,
        maxDrawdown: result.maxDrawdown,
        sharpeRatio: result.sharpeRatio
      }
    });
  }

  // Sort results based on optimization target
  allResults.sort((a, b) => {
    switch (optimizationTarget) {
      case 'sharpe':
        return b.performance.sharpeRatio - a.performance.sharpeRatio;
      case 'sortino':
        // For sortino, we need to run the backtest again with the best parameters
        // This is a simplification
        return b.performance.sharpeRatio - a.performance.sharpeRatio;
      case 'total_return':
        return b.performance.totalReturn - a.performance.totalReturn;
      case 'max_drawdown':
        return a.performance.maxDrawdown - b.performance.maxDrawdown;
      case 'profit_factor':
        // For profit factor, we need to run the backtest again with the best parameters
        // This is a simplification
        return b.performance.totalReturn / Math.abs(a.performance.maxDrawdown) -
               a.performance.totalReturn / Math.abs(b.performance.maxDrawdown);
      default:
        return b.performance.sharpeRatio - a.performance.sharpeRatio;
    }
  });

  // Get best parameters
  const bestResult = allResults[0];

  // Run a final backtest with the best parameters to get complete metrics
  const parameterizedStrategy = (data: HistoricalPriceData[], index: number) =>
    strategyFunction(data, index, bestResult.parameters);

  const finalResult = runBacktest(baseConfig, historicalData, parameterizedStrategy);

  // Calculate parameter sensitivity
  const parameterSensitivity = calculateParameterSensitivity(
    allResults,
    Object.keys(parameterRanges),
    optimizationTarget
  );

  return {
    bestParameters: bestResult.parameters,
    performance: {
      finalCapital: finalResult.finalCapital,
      totalReturn: finalResult.totalReturnPercentage,
      maxDrawdown: finalResult.maxDrawdown,
      sharpeRatio: finalResult.sharpeRatio,
      sortinoRatio: finalResult.sortinoRatio,
      winRate: finalResult.winRate,
      profitFactor: finalResult.profitFactor
    },
    allResults,
    parameterSensitivity
  };
};

/**
 * Generate all combinations of parameters within specified ranges
 * @param parameterRanges Parameter ranges
 * @returns Array of parameter combinations
 */
const generateParameterCombinations = (
  parameterRanges: Record<string, { min: number; max: number; step: number }>
): Record<string, any>[] => {
  // Generate values for each parameter
  const parameterValues: Record<string, number[]> = {};

  for (const [param, range] of Object.entries(parameterRanges)) {
    const values: number[] = [];
    for (let value = range.min; value <= range.max; value += range.step) {
      values.push(value);
    }
    parameterValues[param] = values;
  }

  // Generate all combinations
  const combinations: Record<string, any>[] = [{}];

  for (const [param, values] of Object.entries(parameterValues)) {
    const newCombinations: Record<string, any>[] = [];

    for (const combination of combinations) {
      for (const value of values) {
        newCombinations.push({
          ...combination,
          [param]: value
        });
      }
    }

    combinations.length = 0;
    combinations.push(...newCombinations);
  }

  return combinations;
};

/**
 * Calculate parameter sensitivity
 * @param results Backtest results for different parameter combinations
 * @param parameters Parameters to analyze
 * @param optimizationTarget Metric used for optimization
 * @returns Parameter sensitivity analysis
 */
const calculateParameterSensitivity = (
  results: ParameterOptimizationResult['allResults'],
  parameters: string[],
  optimizationTarget: string
): { parameter: string; sensitivity: number }[] => {
  const sensitivity: { parameter: string; sensitivity: number }[] = [];

  for (const param of parameters) {
    // Group results by parameter value
    const resultsByParamValue: Record<number, typeof results> = {};

    for (const result of results) {
      const value = result.parameters[param];
      if (!resultsByParamValue[value]) {
        resultsByParamValue[value] = [];
      }
      resultsByParamValue[value].push(result);
    }

    // Calculate average performance for each parameter value
    const performanceByValue: Record<number, number> = {};

    for (const [value, valueResults] of Object.entries(resultsByParamValue)) {
      let avgPerformance = 0;

      switch (optimizationTarget) {
        case 'sharpe':
          avgPerformance = valueResults.reduce((sum, r) => sum + r.performance.sharpeRatio, 0) / valueResults.length;
          break;
        case 'total_return':
          avgPerformance = valueResults.reduce((sum, r) => sum + r.performance.totalReturn, 0) / valueResults.length;
          break;
        case 'max_drawdown':
          avgPerformance = valueResults.reduce((sum, r) => sum + r.performance.maxDrawdown, 0) / valueResults.length;
          break;
        default:
          avgPerformance = valueResults.reduce((sum, r) => sum + r.performance.sharpeRatio, 0) / valueResults.length;
      }

      performanceByValue[Number(value)] = avgPerformance;
    }

    // Calculate variance of performance across parameter values
    const performances = Object.values(performanceByValue);
    const mean = performances.reduce((sum, p) => sum + p, 0) / performances.length;
    const variance = performances.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / performances.length;

    // Higher variance means higher sensitivity
    sensitivity.push({
      parameter: param,
      sensitivity: Math.sqrt(variance)
    });
  }

  // Sort by sensitivity (descending)
  return sensitivity.sort((a, b) => b.sensitivity - a.sensitivity);
};

/**
 * Import historical data from CSV file
 * @param csvData CSV data string
 * @param mapping Column mapping
 * @returns Historical price data
 */
export const importHistoricalDataFromCSV = (
  csvData: string,
  mapping: {
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }
): HistoricalPriceData[] => {
  // Parse CSV data
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');

  // Create index mapping
  const indices: Record<string, number> = {};
  for (const [key, value] of Object.entries(mapping)) {
    indices[key] = headers.indexOf(value);
    if (indices[key] === -1) {
      throw new Error(`Column ${value} not found in CSV headers`);
    }
  }

  // Parse data rows
  const data: HistoricalPriceData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');

    data.push({
      timestamp: values[indices.timestamp],
      open: parseFloat(values[indices.open]),
      high: parseFloat(values[indices.high]),
      low: parseFloat(values[indices.low]),
      close: parseFloat(values[indices.close]),
      volume: parseFloat(values[indices.volume])
    });
  }

  return data;
};