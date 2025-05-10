/**
 * Types for the backtesting framework
 */

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  symbol: string;
  timeframe: string; // 1m, 5m, 15m, 1h, 4h, 1d
  data: HistoricalDataPoint[];
  startTime: number;
  endTime: number;
}

export interface BacktestTrade {
  entryTime: number;
  entryPrice: number;
  exitTime: number | null;
  exitPrice: number | null;
  quantity: number;
  direction: 'long' | 'short';
  profit: number;
  profitPercentage: number;
  status: 'open' | 'closed';
  exitReason?: string;
}

export interface BacktestPosition {
  symbol: string;
  entryTime: number;
  entryPrice: number;
  quantity: number;
  direction: 'long' | 'short';
  stopLoss: number | null;
  takeProfit: number | null;
  trades: BacktestTrade[];
  currentPrice: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}

export interface BacktestResult {
  startTime: number;
  endTime: number;
  initialCapital: number;
  finalCapital: number;
  totalProfit: number;
  totalProfitPercentage: number;
  winRate: number;
  trades: BacktestTrade[];
  positions: BacktestPosition[];
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  sharpeRatio: number;
  dailyReturns: { date: number; return: number }[];
  monthlyReturns: { date: number; return: number }[];
  equityCurve: { timestamp: number; equity: number }[];
  strategyName: string;
  strategyParams: Record<string, any>;
}

export interface BacktestParams {
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  strategyName: string;
  strategyParams: Record<string, any>;
  riskManagement: {
    stopLossPercentage: number | null;
    takeProfitPercentage: number | null;
    trailingStopLoss: boolean;
    trailingStopLossDistance: number | null;
    positionSizePercentage: number;
    maxOpenPositions: number;
  };
}

export interface TradingStrategy {
  name: string;
  description: string;
  params: Record<string, any>;
  execute: (
    data: HistoricalDataPoint[], 
    currentIndex: number, 
    params: Record<string, any>
  ) => { 
    signal: 'buy' | 'sell' | 'hold'; 
    confidence: number;
    metadata?: Record<string, any>;
  };
}

export interface BacktestingService {
  runBacktest: (params: BacktestParams) => Promise<BacktestResult>;
  getAvailableStrategies: () => TradingStrategy[];
  getAvailableSymbols: () => Promise<string[]>;
  getAvailableTimeframes: () => string[];
  getHistoricalData: (symbol: string, timeframe: string, startDate: Date, endDate: Date) => Promise<HistoricalData>;
}
