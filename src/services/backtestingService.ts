import {
  BacktestParams,
  BacktestResult,
  BacktestTrade,
  HistoricalData,
  HistoricalDataPoint,
  TradingStrategy
} from "@/types/backtesting";
import { toast } from "sonner";

/**
 * Predefined trading strategies
 */
const tradingStrategies: TradingStrategy[] = [
  {
    name: "Simple Moving Average Crossover",
    description: "Buy when fast MA crosses above slow MA, sell when it crosses below",
    params: {
      fastPeriod: 10,
      slowPeriod: 30
    },
    execute: (data: HistoricalDataPoint[], currentIndex: number, params: Record<string, any>) => {
      if (currentIndex < params.slowPeriod) {
        return { signal: 'hold', confidence: 0 };
      }

      // Calculate fast MA
      const fastMA = calculateSMA(
        data.slice(currentIndex - params.fastPeriod, currentIndex).map(d => d.close),
        params.fastPeriod
      );

      // Calculate slow MA
      const slowMA = calculateSMA(
        data.slice(currentIndex - params.slowPeriod, currentIndex).map(d => d.close),
        params.slowPeriod
      );

      // Calculate previous fast MA
      const prevFastMA = calculateSMA(
        data.slice(currentIndex - params.fastPeriod - 1, currentIndex - 1).map(d => d.close),
        params.fastPeriod
      );

      // Calculate previous slow MA
      const prevSlowMA = calculateSMA(
        data.slice(currentIndex - params.slowPeriod - 1, currentIndex - 1).map(d => d.close),
        params.slowPeriod
      );

      // Check for crossover
      if (prevFastMA <= prevSlowMA && fastMA > slowMA) {
        // Bullish crossover
        return {
          signal: 'buy',
          confidence: 80,
          metadata: { fastMA, slowMA }
        };
      } else if (prevFastMA >= prevSlowMA && fastMA < slowMA) {
        // Bearish crossover
        return {
          signal: 'sell',
          confidence: 80,
          metadata: { fastMA, slowMA }
        };
      }

      return { signal: 'hold', confidence: 0 };
    }
  },
  {
    name: "RSI Strategy",
    description: "Buy when RSI is oversold, sell when RSI is overbought",
    params: {
      period: 14,
      oversold: 30,
      overbought: 70
    },
    execute: (data: HistoricalDataPoint[], currentIndex: number, params: Record<string, any>) => {
      if (currentIndex < params.period) {
        return { signal: 'hold', confidence: 0 };
      }

      const prices = data.slice(currentIndex - params.period - 1, currentIndex).map(d => d.close);
      const rsi = calculateRSI(prices, params.period);

      if (rsi <= params.oversold) {
        return {
          signal: 'buy',
          confidence: 70 + (params.oversold - rsi),
          metadata: { rsi }
        };
      } else if (rsi >= params.overbought) {
        return {
          signal: 'sell',
          confidence: 70 + (rsi - params.overbought),
          metadata: { rsi }
        };
      }

      return { signal: 'hold', confidence: 0 };
    }
  },
  {
    name: "MACD Strategy",
    description: "Buy on MACD histogram crossover above signal line, sell on crossover below",
    params: {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9
    },
    execute: (data: HistoricalDataPoint[], currentIndex: number, params: Record<string, any>) => {
      const { fastPeriod, slowPeriod, signalPeriod } = params;

      if (currentIndex < slowPeriod + signalPeriod) {
        return { signal: 'hold', confidence: 0 };
      }

      const prices = data.slice(0, currentIndex + 1).map(d => d.close);
      const macdResult = calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod);

      const currentHistogram = macdResult.histogram[macdResult.histogram.length - 1];
      const previousHistogram = macdResult.histogram[macdResult.histogram.length - 2];

      if (previousHistogram <= 0 && currentHistogram > 0) {
        return {
          signal: 'buy',
          confidence: 75,
          metadata: { macd: macdResult.macd[macdResult.macd.length - 1], signal: macdResult.signal[macdResult.signal.length - 1] }
        };
      } else if (previousHistogram >= 0 && currentHistogram < 0) {
        return {
          signal: 'sell',
          confidence: 75,
          metadata: { macd: macdResult.macd[macdResult.macd.length - 1], signal: macdResult.signal[macdResult.signal.length - 1] }
        };
      }

      return { signal: 'hold', confidence: 0 };
    }
  }
];

/**
 * Helper function to calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return 0;
  }

  const sum = prices.reduce((total, price) => total + price, 0);
  return sum / period;
}

/**
 * Helper function to calculate RSI
 */
function calculateRSI(prices: number[], period: number): number {
  if (prices.length <= period) {
    return 50; // Default value if not enough data
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI using Wilder's smoothing method
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    let currentGain = 0;
    let currentLoss = 0;

    if (change >= 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Helper function to calculate MACD
 */
function calculateMACD(prices: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  // Calculate EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Calculate MACD line
  const macdLine = fastEMA.map((fast, i) => {
    if (i < slowPeriod - 1) return 0;
    return fast - slowEMA[i - (slowPeriod - fastPeriod)];
  }).slice(slowPeriod - 1);

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  const histogram = macdLine.slice(signalPeriod - 1).map((macd, i) => macd - signalLine[i]);

  return {
    macd: macdLine.slice(signalPeriod - 1),
    signal: signalLine,
    histogram
  };
}

/**
 * Helper function to calculate Exponential Moving Average
 */
function calculateEMA(prices: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);

  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    ema.push((prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }

  return ema;
}

/**
 * Calculate Sharpe Ratio
 */
function calculateSharpeRatio(returns: number[], riskFreeRate = 0.02): number {
  if (returns.length === 0) return 0;

  // Calculate average return
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;

  // Calculate standard deviation
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  // Annualize (assuming daily returns)
  const annualizedReturn = avgReturn * 252; // 252 trading days in a year
  const annualizedStdDev = stdDev * Math.sqrt(252);

  return (annualizedReturn - riskFreeRate) / annualizedStdDev;
}

/**
 * Calculate Maximum Drawdown
 */
function calculateMaxDrawdown(equityCurve: number[]): { maxDrawdown: number, maxDrawdownPercentage: number } {
  let peak = equityCurve[0];
  let maxDrawdown = 0;
  let maxDrawdownPercentage = 0;

  for (const equity of equityCurve) {
    if (equity > peak) {
      peak = equity;
    }

    const drawdown = peak - equity;
    const drawdownPercentage = (drawdown / peak) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercentage = drawdownPercentage;
    }
  }

  return { maxDrawdown, maxDrawdownPercentage };
}

/**
 * Fetch historical data for a symbol
 */
async function fetchHistoricalData(symbol: string, timeframe: string, startDate: Date, endDate: Date): Promise<HistoricalData> {
  try {
    // In a real implementation, this would fetch data from an API
    // For now, we'll generate mock data
    const data: HistoricalDataPoint[] = [];
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    // Determine interval based on timeframe
    let interval = 60 * 60 * 1000; // Default to 1h
    switch (timeframe) {
      case '1m': interval = 60 * 1000; break;
      case '5m': interval = 5 * 60 * 1000; break;
      case '15m': interval = 15 * 60 * 1000; break;
      case '1h': interval = 60 * 60 * 1000; break;
      case '4h': interval = 4 * 60 * 60 * 1000; break;
      case '1d': interval = 24 * 60 * 60 * 1000; break;
    }

    // Generate data points
    let currentTime = startTime;
    let lastClose = 100; // Starting price

    while (currentTime <= endTime) {
      // Generate realistic price movement
      const volatility = 0.02; // 2% volatility
      const change = lastClose * volatility * (Math.random() - 0.5);
      const open = lastClose;
      const close = open + change;
      const high = Math.max(open, close) + Math.abs(change) * Math.random();
      const low = Math.min(open, close) - Math.abs(change) * Math.random();
      const volume = Math.floor(Math.random() * 1000000) + 100000;

      data.push({
        timestamp: currentTime,
        open,
        high,
        low,
        close,
        volume
      });

      lastClose = close;
      currentTime += interval;
    }

    return {
      symbol,
      timeframe,
      data,
      startTime,
      endTime
    };
  } catch (error) {
    console.error("Error fetching historical data:", error);
    throw new Error("Failed to fetch historical data");
  }
}

/**
 * Get available trading strategies
 */
export function getAvailableStrategies(): TradingStrategy[] {
  return tradingStrategies;
}

/**
 * Get available symbols for backtesting
 */
export async function getAvailableSymbols(): Promise<string[]> {
  // In a real implementation, this would fetch from an API
  // For now, return a static list
  return [
    "SOL/USD",
    "BTC/USD",
    "ETH/USD",
    "BONK/USD",
    "WIF/USD",
    "JUP/USD",
    "RNDR/USD",
    "PYTH/USD"
  ];
}

/**
 * Get available timeframes for backtesting
 */
export function getAvailableTimeframes(): string[] {
  return ["1m", "5m", "15m", "1h", "4h", "1d"];
}

/**
 * Get historical data for a symbol
 */
export async function getHistoricalData(
  symbol: string,
  timeframe: string,
  startDate: Date,
  endDate: Date
): Promise<HistoricalData> {
  return fetchHistoricalData(symbol, timeframe, startDate, endDate);
}

/**
 * Run a backtest with the given parameters
 */
export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  try {
    // Fetch historical data
    const historicalData = await fetchHistoricalData(
      params.symbol,
      params.timeframe,
      params.startDate,
      params.endDate
    );

    // Find the strategy
    const strategy = tradingStrategies.find(s => s.name === params.strategyName);
    if (!strategy) {
      throw new Error(`Strategy "${params.strategyName}" not found`);
    }

    // Initialize backtest variables
    let capital = params.initialCapital;
    const trades: BacktestTrade[] = [];
    const positions: BacktestPosition[] = [];
    const equityCurve: { timestamp: number; equity: number }[] = [];
    const dailyReturns: { date: number; return: number }[] = [];
    let lastDayTimestamp = 0;
    let lastDayEquity = params.initialCapital;

    // Track open position
    let openPosition: BacktestPosition | null = null;

    // Run the backtest
    for (let i = 0; i < historicalData.data.length; i++) {
      const candle = historicalData.data[i];

      // Execute strategy
      const result = strategy.execute(historicalData.data, i, params.strategyParams);

      // Update equity curve
      equityCurve.push({
        timestamp: candle.timestamp,
        equity: capital + (openPosition ?
          openPosition.quantity * candle.close - openPosition.quantity * openPosition.entryPrice : 0)
      });

      // Calculate daily returns
      const currentDay = new Date(candle.timestamp).setHours(0, 0, 0, 0);
      if (lastDayTimestamp === 0) {
        lastDayTimestamp = currentDay;
        lastDayEquity = equityCurve[equityCurve.length - 1].equity;
      } else if (currentDay > lastDayTimestamp) {
        const currentEquity = equityCurve[equityCurve.length - 1].equity;
        const dailyReturn = (currentEquity - lastDayEquity) / lastDayEquity;
        dailyReturns.push({
          date: lastDayTimestamp,
          return: dailyReturn
        });
        lastDayTimestamp = currentDay;
        lastDayEquity = currentEquity;
      }

      // Check for stop loss or take profit if we have an open position
      if (openPosition) {
        const currentPrice = candle.close;
        const entryPrice = openPosition.entryPrice;
        const direction = openPosition.direction;

        // Check stop loss
        if (openPosition.stopLoss !== null) {
          if ((direction === 'long' && currentPrice <= openPosition.stopLoss) ||
              (direction === 'short' && currentPrice >= openPosition.stopLoss)) {
            // Stop loss hit
            const profit = direction === 'long' ?
              openPosition.quantity * (openPosition.stopLoss - entryPrice) :
              openPosition.quantity * (entryPrice - openPosition.stopLoss);

            const profitPercentage = direction === 'long' ?
              ((openPosition.stopLoss / entryPrice) - 1) * 100 :
              ((entryPrice / openPosition.stopLoss) - 1) * 100;

            // Close the trade
            const trade: BacktestTrade = {
              entryTime: openPosition.entryTime,
              entryPrice: entryPrice,
              exitTime: candle.timestamp,
              exitPrice: openPosition.stopLoss,
              quantity: openPosition.quantity,
              direction: direction,
              profit: profit,
              profitPercentage: profitPercentage,
              status: 'closed',
              exitReason: 'stop_loss'
            };

            trades.push(trade);
            openPosition.trades.push(trade);
            capital += profit;
            openPosition = null;
            continue;
          }
        }

        // Check take profit
        if (openPosition.takeProfit !== null) {
          if ((direction === 'long' && currentPrice >= openPosition.takeProfit) ||
              (direction === 'short' && currentPrice <= openPosition.takeProfit)) {
            // Take profit hit
            const profit = direction === 'long' ?
              openPosition.quantity * (openPosition.takeProfit - entryPrice) :
              openPosition.quantity * (entryPrice - openPosition.takeProfit);

            const profitPercentage = direction === 'long' ?
              ((openPosition.takeProfit / entryPrice) - 1) * 100 :
              ((entryPrice / openPosition.takeProfit) - 1) * 100;

            // Close the trade
            const trade: BacktestTrade = {
              entryTime: openPosition.entryTime,
              entryPrice: entryPrice,
              exitTime: candle.timestamp,
              exitPrice: openPosition.takeProfit,
              quantity: openPosition.quantity,
              direction: direction,
              profit: profit,
              profitPercentage: profitPercentage,
              status: 'closed',
              exitReason: 'take_profit'
            };

            trades.push(trade);
            openPosition.trades.push(trade);
            capital += profit;
            openPosition = null;
            continue;
          }
        }
      }

      // Process trading signals
      if (result.signal === 'buy' && !openPosition) {
        // Calculate position size
        const positionSize = capital * (params.riskManagement.positionSizePercentage / 100);
        const quantity = positionSize / candle.close;

        // Calculate stop loss and take profit levels
        let stopLoss = null;
        let takeProfit = null;

        if (params.riskManagement.stopLossPercentage) {
          stopLoss = candle.close * (1 - params.riskManagement.stopLossPercentage / 100);
        }

        if (params.riskManagement.takeProfitPercentage) {
          takeProfit = candle.close * (1 + params.riskManagement.takeProfitPercentage / 100);
        }

        // Open a new position
        openPosition = {
          symbol: params.symbol,
          entryTime: candle.timestamp,
          entryPrice: candle.close,
          quantity: quantity,
          direction: 'long',
          stopLoss: stopLoss,
          takeProfit: takeProfit,
          trades: [],
          currentPrice: candle.close,
          currentValue: quantity * candle.close,
          profit: 0,
          profitPercentage: 0
        };

        positions.push(openPosition);

      } else if (result.signal === 'sell' && openPosition) {
        // Close the position
        const profit = openPosition.direction === 'long' ?
          openPosition.quantity * (candle.close - openPosition.entryPrice) :
          openPosition.quantity * (openPosition.entryPrice - candle.close);

        const profitPercentage = openPosition.direction === 'long' ?
          ((candle.close / openPosition.entryPrice) - 1) * 100 :
          ((openPosition.entryPrice / candle.close) - 1) * 100;

        // Create a trade
        const trade: BacktestTrade = {
          entryTime: openPosition.entryTime,
          entryPrice: openPosition.entryPrice,
          exitTime: candle.timestamp,
          exitPrice: candle.close,
          quantity: openPosition.quantity,
          direction: openPosition.direction,
          profit: profit,
          profitPercentage: profitPercentage,
          status: 'closed',
          exitReason: 'signal'
        };

        trades.push(trade);
        openPosition.trades.push(trade);
        capital += profit;
        openPosition = null;
      }
    }

    // Close any remaining open position at the last price
    if (openPosition) {
      const lastCandle = historicalData.data[historicalData.data.length - 1];
      const profit = openPosition.direction === 'long' ?
        openPosition.quantity * (lastCandle.close - openPosition.entryPrice) :
        openPosition.quantity * (openPosition.entryPrice - lastCandle.close);

      const profitPercentage = openPosition.direction === 'long' ?
        ((lastCandle.close / openPosition.entryPrice) - 1) * 100 :
        ((openPosition.entryPrice / lastCandle.close) - 1) * 100;

      // Create a trade
      const trade: BacktestTrade = {
        entryTime: openPosition.entryTime,
        entryPrice: openPosition.entryPrice,
        exitTime: lastCandle.timestamp,
        exitPrice: lastCandle.close,
        quantity: openPosition.quantity,
        direction: openPosition.direction,
        profit: profit,
        profitPercentage: profitPercentage,
        status: 'closed',
        exitReason: 'end_of_backtest'
      };

      trades.push(trade);
      openPosition.trades.push(trade);
      capital += profit;
    }

    // Calculate performance metrics
    const finalCapital = capital;
    const totalProfit = finalCapital - params.initialCapital;
    const totalProfitPercentage = (totalProfit / params.initialCapital) * 100;

    // Calculate win rate
    const winningTrades = trades.filter(t => t.profit > 0).length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    // Calculate max drawdown
    const equityValues = equityCurve.map(e => e.equity);
    const { maxDrawdown, maxDrawdownPercentage } = calculateMaxDrawdown(equityValues);

    // Calculate Sharpe ratio
    const returns = dailyReturns.map(r => r.return);
    const sharpeRatio = calculateSharpeRatio(returns);

    // Calculate monthly returns
    const monthlyReturns: { date: number; return: number }[] = [];
    let lastMonthTimestamp = 0;
    let lastMonthEquity = params.initialCapital;

    for (const point of equityCurve) {
      const date = new Date(point.timestamp);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      if (lastMonthTimestamp === 0) {
        lastMonthTimestamp = monthStart;
      } else if (monthStart > lastMonthTimestamp) {
        const monthlyReturn = (point.equity - lastMonthEquity) / lastMonthEquity;
        monthlyReturns.push({
          date: lastMonthTimestamp,
          return: monthlyReturn
        });
        lastMonthTimestamp = monthStart;
        lastMonthEquity = point.equity;
      }
    }

    // Return the backtest result
    return {
      startTime: historicalData.startTime,
      endTime: historicalData.endTime,
      initialCapital: params.initialCapital,
      finalCapital,
      totalProfit,
      totalProfitPercentage,
      winRate,
      trades,
      positions,
      maxDrawdown,
      maxDrawdownPercentage,
      sharpeRatio,
      dailyReturns,
      monthlyReturns,
      equityCurve,
      strategyName: params.strategyName,
      strategyParams: params.strategyParams
    };
  } catch (error) {
    console.error("Error running backtest:", error);
    toast.error("Backtest failed", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    throw error;
  }
}
