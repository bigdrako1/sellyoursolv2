import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Lazy load chart components
const ChartComponents = lazy(() => import('@/components/ChartComponents'));
import {
  Play,
  BarChart2,
  Settings,
  Save,
  Download,
  Calendar,
  TrendingUp,
  Zap,
  Shield,
  AlertTriangle,
  Percent,
  DollarSign
} from 'lucide-react';
import {
  BacktestConfig,
  BacktestResult,
  loadHistoricalData,
  runBacktest,
  StrategyType,
  MarketCondition
} from '@/utils/backtestingUtils';
import { formatCurrency, formatPercent } from '@/utils/formatters';

// Sample strategies for testing
const sampleStrategies = {
  // Simple moving average crossover strategy
  smaCrossover: (data: any[], index: number): 'buy' | 'sell' | 'hold' => {
    if (index < 50) return 'hold'; // Need enough data for moving averages

    // Calculate 20-day and 50-day simple moving averages
    const prices = data.slice(0, index + 1).map(candle => candle.close);
    const sma20 = prices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const sma50 = prices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;

    // Previous day's SMAs
    const prevPrices = data.slice(0, index).map(candle => candle.close);
    const prevSma20 = prevPrices.slice(-20).reduce((sum, price) => sum + price, 0) / 20;
    const prevSma50 = prevPrices.slice(-50).reduce((sum, price) => sum + price, 0) / 50;

    // Buy when 20-day SMA crosses above 50-day SMA
    if (prevSma20 <= prevSma50 && sma20 > sma50) {
      return 'buy';
    }

    // Sell when 20-day SMA crosses below 50-day SMA
    if (prevSma20 >= prevSma50 && sma20 < sma50) {
      return 'sell';
    }

    return 'hold';
  },

  // Momentum strategy
  momentum: (data: any[], index: number): 'buy' | 'sell' | 'hold' => {
    if (index < 20) return 'hold'; // Need enough data

    // Calculate 14-day momentum
    const currentPrice = data[index].close;
    const priceNPeriodsAgo = data[index - 14].close;
    const momentum = (currentPrice - priceNPeriodsAgo) / priceNPeriodsAgo * 100;

    // Buy when momentum is positive and increasing
    if (momentum > 5) {
      return 'buy';
    }

    // Sell when momentum turns negative
    if (momentum < -3) {
      return 'sell';
    }

    return 'hold';
  },

  // Volume breakout strategy
  volumeBreakout: (data: any[], index: number): 'buy' | 'sell' | 'hold' => {
    if (index < 20) return 'hold'; // Need enough data

    // Calculate average volume over last 20 periods
    const volumes = data.slice(index - 20, index).map(candle => candle.volume);
    const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;

    // Current volume and price
    const currentVolume = data[index].volume;
    const currentPrice = data[index].close;
    const previousPrice = data[index - 1].close;

    // Buy on volume breakout with price increase
    if (currentVolume > avgVolume * 2 && currentPrice > previousPrice * 1.03) {
      return 'buy';
    }

    // Sell on volume spike with price decrease
    if (currentVolume > avgVolume * 1.5 && currentPrice < previousPrice * 0.97) {
      return 'sell';
    }

    return 'hold';
  }
};

const BacktestingDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('config');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('smaCrossover');
  const [historicalData, setHistoricalData] = useState([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // Backtest configuration
  const [config, setConfig] = useState<BacktestConfig>({
    // Basic configuration
    strategyName: 'SMA Crossover',
    strategyType: 'trend_following',
    initialCapital: 10000,
    startDate: '2023-01-01',
    endDate: '2023-12-31',

    // Trading costs
    feePercentage: 0.1,
    slippagePercentage: 0.2,

    // Risk management
    enableTrailingStopLoss: true,
    trailingStopLossDistance: 10,
    secureInitial: true,
    secureInitialThreshold: 100,
    takeProfit: 30,
    stopLoss: 10,
    maxPositions: 3,
    maxPositionSize: 30,
    riskPerTrade: 2,

    // Advanced options
    enableScaleOut: false,
    scaleOutLevels: [
      { percentage: 50, amount: 25 },
      { percentage: 100, amount: 50 }
    ],
    reinvestProfits: true,
    enableVolatilityAdjustment: false,
    volatilityLookback: 20,

    // Market condition filters
    marketConditionFilter: ['bull', 'sideways'],

    // Optimization parameters
    optimizationTarget: 'sharpe'
  });

  // Handle config changes
  const handleConfigChange = (field: keyof BacktestConfig, value: any) => {
    setConfig({
      ...config,
      [field]: value
    });
  };

  // Run backtest
  const runBacktestSimulation = async () => {
    setIsRunning(true);
    setActiveTab('results');

    try {
      // Load historical data
      const data = await loadHistoricalData(
        'SAMPLE_TOKEN',
        config.startDate,
        config.endDate,
        '1d'
      );

      setHistoricalData(data);

      // Run backtest with selected strategy
      const strategyFunction = sampleStrategies[selectedStrategy as keyof typeof sampleStrategies];
      const result = runBacktest(config, data, strategyFunction);

      setBacktestResult(result);

      toast({
        title: 'Backtest Completed',
        description: `Final capital: ${formatCurrency(result.finalCapital)}, Return: ${formatPercent(result.totalReturnPercentage)}`,
      });
    } catch (error) {
      console.error('Backtest error:', error);
      toast({
        title: 'Backtest Error',
        description: 'An error occurred while running the backtest',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Save backtest result
  const saveBacktestResult = () => {
    if (!backtestResult) return;

    try {
      // In a real app, this would save to a database
      // For now, just save to localStorage
      const savedBacktests = JSON.parse(localStorage.getItem('saved_backtests') || '[]');

      // Create a summary of the backtest result to save space
      const backtestSummary = {
        id: `backtest_${Date.now()}`,
        strategyName: backtestResult.strategyName,
        strategyType: backtestResult.strategyType,
        savedAt: new Date().toISOString(),
        initialCapital: backtestResult.initialCapital,
        finalCapital: backtestResult.finalCapital,
        totalReturnPercentage: backtestResult.totalReturnPercentage,
        annualizedReturn: backtestResult.annualizedReturn,
        winRate: backtestResult.winRate,
        totalTrades: backtestResult.totalTrades,
        profitFactor: backtestResult.profitFactor,
        sharpeRatio: backtestResult.sharpeRatio,
        sortinoRatio: backtestResult.sortinoRatio,
        maxDrawdownPercentage: backtestResult.maxDrawdownPercentage,
        maxDrawdownDuration: backtestResult.maxDrawdownDuration,
        calmarRatio: backtestResult.calmarRatio,
        averageHoldingPeriod: backtestResult.averageHoldingPeriod,
        config: {
          ...config,
          startDate: config.startDate,
          endDate: config.endDate
        }
      };

      // Add the summary to the saved backtests
      savedBacktests.push(backtestSummary);

      // Limit to the last 20 backtests to prevent localStorage from getting too large
      if (savedBacktests.length > 20) {
        savedBacktests.shift(); // Remove the oldest backtest
      }

      localStorage.setItem('saved_backtests', JSON.stringify(savedBacktests));

      toast({
        title: 'Backtest Saved',
        description: 'Backtest results have been saved successfully',
      });
    } catch (error) {
      console.error('Error saving backtest:', error);
      toast({
        title: 'Save Error',
        description: 'An error occurred while saving the backtest results',
        variant: 'destructive',
      });
    }
  };

  // Export backtest result as CSV
  const exportBacktestResult = () => {
    if (!backtestResult) return;

    // Create CSV content for equity curve
    let equityCsvContent = 'data:text/csv;charset=utf-8,';

    // Add header
    equityCsvContent += 'Date,Equity,Drawdown,Daily Return\n';

    // Add data rows
    backtestResult.equityCurve.forEach((point, index) => {
      const drawdown = backtestResult.drawdownCurve[index]?.drawdown || 0;
      const dailyReturn = index > 0 ? backtestResult.dailyReturns[index - 1]?.return || 0 : 0;
      equityCsvContent += `${point.date},${point.equity},${drawdown},${dailyReturn}\n`;
    });

    // Create download link for equity curve
    const equityEncodedUri = encodeURI(equityCsvContent);
    const equityLink = document.createElement('a');
    equityLink.setAttribute('href', equityEncodedUri);
    equityLink.setAttribute('download', `backtest_equity_${config.strategyName}_${new Date().toISOString()}.csv`);
    document.body.appendChild(equityLink);

    // Trigger download
    equityLink.click();

    // Create CSV content for performance metrics
    let metricsCsvContent = 'data:text/csv;charset=utf-8,';

    // Add header and data for performance metrics
    metricsCsvContent += 'Metric,Value\n';
    metricsCsvContent += `Strategy Name,${backtestResult.strategyName}\n`;
    metricsCsvContent += `Strategy Type,${backtestResult.strategyType}\n`;
    metricsCsvContent += `Initial Capital,${backtestResult.initialCapital}\n`;
    metricsCsvContent += `Final Capital,${backtestResult.finalCapital}\n`;
    metricsCsvContent += `Total Return,${backtestResult.totalReturn}\n`;
    metricsCsvContent += `Total Return Percentage,${backtestResult.totalReturnPercentage}\n`;
    metricsCsvContent += `Annualized Return,${backtestResult.annualizedReturn}\n`;
    metricsCsvContent += `Total Trades,${backtestResult.totalTrades}\n`;
    metricsCsvContent += `Winning Trades,${backtestResult.winningTrades}\n`;
    metricsCsvContent += `Losing Trades,${backtestResult.losingTrades}\n`;
    metricsCsvContent += `Win Rate,${backtestResult.winRate}\n`;
    metricsCsvContent += `Average Win,${backtestResult.averageWin}\n`;
    metricsCsvContent += `Average Loss,${backtestResult.averageLoss}\n`;
    metricsCsvContent += `Largest Win,${backtestResult.largestWin}\n`;
    metricsCsvContent += `Largest Loss,${backtestResult.largestLoss}\n`;
    metricsCsvContent += `Average Holding Period,${backtestResult.averageHoldingPeriod}\n`;
    metricsCsvContent += `Profit Factor,${backtestResult.profitFactor}\n`;
    metricsCsvContent += `Expectancy,${backtestResult.expectancy}\n`;
    metricsCsvContent += `Max Drawdown,${backtestResult.maxDrawdown}\n`;
    metricsCsvContent += `Max Drawdown Percentage,${backtestResult.maxDrawdownPercentage}\n`;
    metricsCsvContent += `Max Drawdown Duration,${backtestResult.maxDrawdownDuration}\n`;
    metricsCsvContent += `Recovery Factor,${backtestResult.recoveryFactor}\n`;
    metricsCsvContent += `Calmar Ratio,${backtestResult.calmarRatio}\n`;
    metricsCsvContent += `Sharpe Ratio,${backtestResult.sharpeRatio}\n`;
    metricsCsvContent += `Sortino Ratio,${backtestResult.sortinoRatio}\n`;
    metricsCsvContent += `Market Exposure,${backtestResult.marketExposure}\n`;
    metricsCsvContent += `Return Volatility,${backtestResult.returnVolatility}\n`;
    metricsCsvContent += `Downside Deviation,${backtestResult.downsideDeviation}\n`;

    // Create download link for metrics
    const metricsEncodedUri = encodeURI(metricsCsvContent);
    const metricsLink = document.createElement('a');
    metricsLink.setAttribute('href', metricsEncodedUri);
    metricsLink.setAttribute('download', `backtest_metrics_${config.strategyName}_${new Date().toISOString()}.csv`);
    document.body.appendChild(metricsLink);

    // Trigger download after a short delay
    setTimeout(() => {
      metricsLink.click();

      // Create CSV content for trades
      let tradesCsvContent = 'data:text/csv;charset=utf-8,';

      // Add header for trades
      tradesCsvContent += 'Entry Date,Exit Date,Symbol,Entry Price,Exit Price,Quantity,PnL,PnL %,Fees,Slippage,Holding Period,Exit Reason\n';

      // Add data rows for trades
      backtestResult.trades.forEach(trade => {
        tradesCsvContent += `${trade.entryDate},${trade.exitDate},${trade.symbol},${trade.entryPrice},${trade.exitPrice},${trade.quantity},${trade.pnl},${trade.pnlPercentage},${trade.fees},${trade.slippage},${trade.holdingPeriod},${trade.exitReason}\n`;
      });

      // Create download link for trades
      const tradesEncodedUri = encodeURI(tradesCsvContent);
      const tradesLink = document.createElement('a');
      tradesLink.setAttribute('href', tradesEncodedUri);
      tradesLink.setAttribute('download', `backtest_trades_${config.strategyName}_${new Date().toISOString()}.csv`);
      document.body.appendChild(tradesLink);

      // Trigger download after a short delay
      setTimeout(() => {
        tradesLink.click();

        toast({
          title: 'Export Successful',
          description: 'Backtest results have been exported as CSV files',
        });
      }, 500);
    }, 500);
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Strategy Backtesting
          </div>
          <Badge className={isRunning ? 'bg-yellow-600' : 'bg-blue-600'}>
            {isRunning ? 'Running...' : 'Ready'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Test and optimize trading strategies with historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={!backtestResult}>Results</TabsTrigger>
            <TabsTrigger value="comparison" disabled={!backtestResult}>Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strategy">Strategy</Label>
                  <Select
                    value={selectedStrategy}
                    onValueChange={setSelectedStrategy}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smaCrossover">SMA Crossover</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="volumeBreakout">Volume Breakout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="initialCapital">Initial Capital</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="initialCapital"
                      type="number"
                      value={config.initialCapital}
                      onChange={(e) => handleConfigChange('initialCapital', Number(e.target.value))}
                      className="bg-black/20 border-white/10"
                    />
                    <span className="text-xs text-gray-400">USD</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => handleConfigChange('startDate', e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={config.endDate}
                    onChange={(e) => handleConfigChange('endDate', e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <h3 className="font-medium">Risk Management</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="stopLoss"
                        type="number"
                        value={config.stopLoss}
                        onChange={(e) => handleConfigChange('stopLoss', Number(e.target.value))}
                        className="bg-black/30 border-white/10"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="takeProfit">Take Profit (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="takeProfit"
                        type="number"
                        value={config.takeProfit}
                        onChange={(e) => handleConfigChange('takeProfit', Number(e.target.value))}
                        className="bg-black/30 border-white/10"
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="trailingStopLoss"
                    checked={config.enableTrailingStopLoss}
                    onCheckedChange={(checked) => handleConfigChange('enableTrailingStopLoss', checked)}
                  />
                  <Label htmlFor="trailingStopLoss">Enable Trailing Stop Loss</Label>
                </div>

                {config.enableTrailingStopLoss && (
                  <div>
                    <Label htmlFor="trailingStopLossDistance">
                      Trailing Stop Distance: {config.trailingStopLossDistance}%
                    </Label>
                    <Slider
                      id="trailingStopLossDistance"
                      min={1}
                      max={20}
                      step={1}
                      value={[config.trailingStopLossDistance]}
                      onValueChange={(value) => handleConfigChange('trailingStopLossDistance', value[0])}
                      className="my-2"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="secureInitial"
                    checked={config.secureInitial}
                    onCheckedChange={(checked) => handleConfigChange('secureInitial', checked)}
                  />
                  <Label htmlFor="secureInitial">Secure Initial Investment</Label>
                </div>

                {config.secureInitial && (
                  <div>
                    <Label htmlFor="secureInitialThreshold">
                      Secure Initial at: {config.secureInitialThreshold}% profit
                    </Label>
                    <Slider
                      id="secureInitialThreshold"
                      min={20}
                      max={200}
                      step={10}
                      value={[config.secureInitialThreshold]}
                      onValueChange={(value) => handleConfigChange('secureInitialThreshold', value[0])}
                      className="my-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <h3 className="font-medium">Advanced Options</h3>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableScaleOut"
                    checked={config.enableScaleOut}
                    onCheckedChange={(checked) => handleConfigChange('enableScaleOut', checked)}
                  />
                  <Label htmlFor="enableScaleOut">Enable Scale Out</Label>
                </div>

                {config.enableScaleOut && (
                  <div className="space-y-2 p-3 bg-black/30 rounded-lg">
                    <Label>Scale Out Levels</Label>
                    {config.scaleOutLevels?.map((level, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`scaleOutPercentage${index}`}>Profit %</Label>
                          <Input
                            id={`scaleOutPercentage${index}`}
                            type="number"
                            value={level.percentage}
                            onChange={(e) => {
                              const newLevels = [...(config.scaleOutLevels || [])];
                              newLevels[index] = {
                                ...newLevels[index],
                                percentage: Number(e.target.value)
                              };
                              handleConfigChange('scaleOutLevels', newLevels);
                            }}
                            className="bg-black/30 border-white/10"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`scaleOutAmount${index}`}>Amount %</Label>
                          <Input
                            id={`scaleOutAmount${index}`}
                            type="number"
                            value={level.amount}
                            onChange={(e) => {
                              const newLevels = [...(config.scaleOutLevels || [])];
                              newLevels[index] = {
                                ...newLevels[index],
                                amount: Number(e.target.value)
                              };
                              handleConfigChange('scaleOutLevels', newLevels);
                            }}
                            className="bg-black/30 border-white/10"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="reinvestProfits"
                    checked={config.reinvestProfits}
                    onCheckedChange={(checked) => handleConfigChange('reinvestProfits', checked)}
                  />
                  <Label htmlFor="reinvestProfits">Reinvest Profits</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableVolatilityAdjustment"
                    checked={config.enableVolatilityAdjustment}
                    onCheckedChange={(checked) => handleConfigChange('enableVolatilityAdjustment', checked)}
                  />
                  <Label htmlFor="enableVolatilityAdjustment">Volatility-Based Position Sizing</Label>
                </div>

                {config.enableVolatilityAdjustment && (
                  <div>
                    <Label htmlFor="volatilityLookback">
                      Volatility Lookback: {config.volatilityLookback} days
                    </Label>
                    <Slider
                      id="volatilityLookback"
                      min={5}
                      max={50}
                      step={5}
                      value={[config.volatilityLookback || 20]}
                      onValueChange={(value) => handleConfigChange('volatilityLookback', value[0])}
                      className="my-2"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="strategyType">Strategy Type</Label>
                  <Select
                    value={config.strategyType}
                    onValueChange={(value) => handleConfigChange('strategyType', value)}
                  >
                    <SelectTrigger className="bg-black/30 border-white/10 mt-1">
                      <SelectValue placeholder="Select strategy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trend_following">Trend Following</SelectItem>
                      <SelectItem value="mean_reversion">Mean Reversion</SelectItem>
                      <SelectItem value="breakout">Breakout</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                      <SelectItem value="volatility">Volatility</SelectItem>
                      <SelectItem value="smart_money">Smart Money</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="optimizationTarget">Optimization Target</Label>
                  <Select
                    value={config.optimizationTarget}
                    onValueChange={(value) => handleConfigChange('optimizationTarget', value)}
                  >
                    <SelectTrigger className="bg-black/30 border-white/10 mt-1">
                      <SelectValue placeholder="Select optimization target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                      <SelectItem value="sortino">Sortino Ratio</SelectItem>
                      <SelectItem value="total_return">Total Return</SelectItem>
                      <SelectItem value="max_drawdown">Minimize Drawdown</SelectItem>
                      <SelectItem value="profit_factor">Profit Factor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/5">
                <h3 className="font-medium">Market Condition Filters</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {(['bull', 'bear', 'sideways', 'volatile', 'low_volatility'] as MarketCondition[]).map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Switch
                        id={`marketCondition_${condition}`}
                        checked={config.marketConditionFilter?.includes(condition) || false}
                        onCheckedChange={(checked) => {
                          const currentFilters = config.marketConditionFilter || [];
                          const newFilters = checked
                            ? [...currentFilters, condition]
                            : currentFilters.filter(c => c !== condition);
                          handleConfigChange('marketConditionFilter', newFilters);
                        }}
                      />
                      <Label htmlFor={`marketCondition_${condition}`} className="capitalize">
                        {condition.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="bg-black/20 border-white/10"
                  onClick={() => setConfig({
                    // Basic configuration
                    strategyName: 'SMA Crossover',
                    strategyType: 'trend_following',
                    initialCapital: 10000,
                    startDate: config.startDate,
                    endDate: config.endDate,

                    // Trading costs
                    feePercentage: 0.1,
                    slippagePercentage: 0.2,

                    // Risk management
                    enableTrailingStopLoss: true,
                    trailingStopLossDistance: 10,
                    secureInitial: true,
                    secureInitialThreshold: 100,
                    takeProfit: 30,
                    stopLoss: 10,
                    maxPositions: 3,
                    maxPositionSize: 30,
                    riskPerTrade: 2,

                    // Advanced options
                    enableScaleOut: false,
                    scaleOutLevels: [
                      { percentage: 50, amount: 25 },
                      { percentage: 100, amount: 50 }
                    ],
                    reinvestProfits: true,
                    enableVolatilityAdjustment: false,
                    volatilityLookback: 20,

                    // Market condition filters
                    marketConditionFilter: ['bull', 'sideways'],

                    // Optimization parameters
                    optimizationTarget: 'sharpe'
                  })}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Reset
                </Button>

                <Button
                  onClick={runBacktestSimulation}
                  disabled={isRunning}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            {backtestResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">Total Return</span>
                          <span className="text-2xl font-bold">
                            {formatPercent(backtestResult.totalReturnPercentage)}
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">Win Rate</span>
                          <span className="text-2xl font-bold">
                            {formatPercent(backtestResult.winRate)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {backtestResult.winningTrades} / {backtestResult.totalTrades} trades
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Percent className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">Max Drawdown</span>
                          <span className="text-2xl font-bold">
                            {formatPercent(backtestResult.maxDrawdownPercentage)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {backtestResult.maxDrawdownDuration.toFixed(1)} days
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400">Profit Factor</span>
                          <span className="text-2xl font-bold">
                            {backtestResult.profitFactor.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400">
                            Expectancy: {formatPercent(backtestResult.expectancy)}
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader className="pb-2">
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Sharpe Ratio</span>
                            <span className="font-medium">{backtestResult.sharpeRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Sortino Ratio</span>
                            <span className="font-medium">{backtestResult.sortinoRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Calmar Ratio</span>
                            <span className="font-medium">{backtestResult.calmarRatio.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Recovery Factor</span>
                            <span className="font-medium">{backtestResult.recoveryFactor.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Avg Win</span>
                            <span className="font-medium">{formatPercent(backtestResult.averageWin)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Avg Loss</span>
                            <span className="font-medium">{formatPercent(backtestResult.averageLoss)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Largest Win</span>
                            <span className="font-medium">{formatPercent(backtestResult.largestWin)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Largest Loss</span>
                            <span className="font-medium">{formatPercent(backtestResult.largestLoss)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardHeader className="pb-2">
                      <CardTitle>Trade Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Total Trades</span>
                            <span className="font-medium">{backtestResult.totalTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Winning Trades</span>
                            <span className="font-medium">{backtestResult.winningTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Losing Trades</span>
                            <span className="font-medium">{backtestResult.losingTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Avg Holding Period</span>
                            <span className="font-medium">{backtestResult.averageHoldingPeriod.toFixed(1)} days</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Initial Capital</span>
                            <span className="font-medium">{formatCurrency(backtestResult.initialCapital)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Final Capital</span>
                            <span className="font-medium">{formatCurrency(backtestResult.finalCapital)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Annualized Return</span>
                            <span className="font-medium">{formatPercent(backtestResult.annualizedReturn)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Market Exposure</span>
                            <span className="font-medium">{formatPercent(backtestResult.marketExposure)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-full w-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                        </div>
                      }>
                        <ChartComponents.AreaChartComponent
                          data={backtestResult.equityCurve}
                          dataKey="equity"
                          xAxisDataKey="date"
                          stroke="#6366f1"
                          fill="#6366f1"
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Drawdown Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-full w-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                        </div>
                      }>
                        <ChartComponents.AreaChartComponent
                          data={backtestResult.drawdownCurve}
                          dataKey="drawdown"
                          xAxisDataKey="date"
                          stroke="#ef4444"
                          fill="#ef4444"
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        />
                      </Suspense>
                    </div>
                  </CardContent>
                </Card>

                {backtestResult.marketConditionPerformance && (
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Performance by Market Condition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-64">
                          <Suspense fallback={
                            <div className="flex items-center justify-center h-full w-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                            </div>
                          }>
                            <ChartComponents.BarChartComponent
                              data={backtestResult.marketConditionPerformance}
                              dataKey="returnPercentage"
                              xAxisDataKey="condition"
                              fill="#6366f1"
                            />
                          </Suspense>
                        </div>
                        <div className="h-64">
                          <Suspense fallback={
                            <div className="flex items-center justify-center h-full w-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                            </div>
                          }>
                            <ChartComponents.BarChartComponent
                              data={backtestResult.marketConditionPerformance}
                              dataKey="winRate"
                              xAxisDataKey="condition"
                              fill="#22c55e"
                            />
                          </Suspense>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="bg-black/20 border-white/10"
                    onClick={saveBacktestResult}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-black/20 border-white/10"
                    onClick={exportBacktestResult}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparison">
            {backtestResult && (
              <div className="space-y-6">
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Strategy Comparison</CardTitle>
                    <CardDescription>
                      Compare current strategy with saved strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">Metric</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Current Strategy</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">SMA Crossover</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Momentum</th>
                            <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Volume Breakout</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Total Return</td>
                            <td className="py-2 px-3 text-sm text-right">{formatPercent(backtestResult.totalReturnPercentage)}</td>
                            <td className="py-2 px-3 text-sm text-right">+42.5%</td>
                            <td className="py-2 px-3 text-sm text-right">+38.2%</td>
                            <td className="py-2 px-3 text-sm text-right">+31.7%</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Win Rate</td>
                            <td className="py-2 px-3 text-sm text-right">{formatPercent(backtestResult.winRate)}</td>
                            <td className="py-2 px-3 text-sm text-right">58.3%</td>
                            <td className="py-2 px-3 text-sm text-right">52.1%</td>
                            <td className="py-2 px-3 text-sm text-right">47.5%</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Profit Factor</td>
                            <td className="py-2 px-3 text-sm text-right">{backtestResult.profitFactor.toFixed(2)}</td>
                            <td className="py-2 px-3 text-sm text-right">1.85</td>
                            <td className="py-2 px-3 text-sm text-right">1.62</td>
                            <td className="py-2 px-3 text-sm text-right">1.43</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Sharpe Ratio</td>
                            <td className="py-2 px-3 text-sm text-right">{backtestResult.sharpeRatio.toFixed(2)}</td>
                            <td className="py-2 px-3 text-sm text-right">1.42</td>
                            <td className="py-2 px-3 text-sm text-right">1.28</td>
                            <td className="py-2 px-3 text-sm text-right">1.15</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Sortino Ratio</td>
                            <td className="py-2 px-3 text-sm text-right">{backtestResult.sortinoRatio.toFixed(2)}</td>
                            <td className="py-2 px-3 text-sm text-right">1.95</td>
                            <td className="py-2 px-3 text-sm text-right">1.72</td>
                            <td className="py-2 px-3 text-sm text-right">1.53</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Max Drawdown</td>
                            <td className="py-2 px-3 text-sm text-right">{formatPercent(backtestResult.maxDrawdownPercentage)}</td>
                            <td className="py-2 px-3 text-sm text-right">-18.2%</td>
                            <td className="py-2 px-3 text-sm text-right">-22.5%</td>
                            <td className="py-2 px-3 text-sm text-right">-25.3%</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Calmar Ratio</td>
                            <td className="py-2 px-3 text-sm text-right">{backtestResult.calmarRatio.toFixed(2)}</td>
                            <td className="py-2 px-3 text-sm text-right">1.25</td>
                            <td className="py-2 px-3 text-sm text-right">0.98</td>
                            <td className="py-2 px-3 text-sm text-right">0.85</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-2 px-3 text-sm">Avg Holding Period</td>
                            <td className="py-2 px-3 text-sm text-right">{backtestResult.averageHoldingPeriod.toFixed(1)} days</td>
                            <td className="py-2 px-3 text-sm text-right">8.2 days</td>
                            <td className="py-2 px-3 text-sm text-right">5.7 days</td>
                            <td className="py-2 px-3 text-sm text-right">3.2 days</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Return Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <Suspense fallback={
                          <div className="flex items-center justify-center h-full w-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                          </div>
                        }>
                          <ChartComponents.BarChartComponent
                            data={[
                              { name: 'Current', value: backtestResult.totalReturnPercentage },
                              { name: 'SMA Crossover', value: 42.5 },
                              { name: 'Momentum', value: 38.2 },
                              { name: 'Volume Breakout', value: 31.7 }
                            ]}
                            dataKey="value"
                            xAxisDataKey="name"
                            fill="#6366f1"
                          />
                        </Suspense>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Risk-Adjusted Return</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <Suspense fallback={
                          <div className="flex items-center justify-center h-full w-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trading-highlight"></div>
                          </div>
                        }>
                          <ChartComponents.BarChartComponent
                            data={[
                              { name: 'Current', sharpe: backtestResult.sharpeRatio, sortino: backtestResult.sortinoRatio },
                              { name: 'SMA Crossover', sharpe: 1.42, sortino: 1.95 },
                              { name: 'Momentum', sharpe: 1.28, sortino: 1.72 },
                              { name: 'Volume Breakout', sharpe: 1.15, sortino: 1.53 }
                            ]}
                            dataKey="sharpe"
                            xAxisDataKey="name"
                            fill="#6366f1"
                          />
                        </Suspense>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Monthly Returns Heatmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-1">
                      {backtestResult.monthlyReturns?.map((month, index) => {
                        // Calculate color based on return value
                        const returnValue = month.return;
                        let bgColor = 'bg-gray-800'; // neutral

                        if (returnValue > 0) {
                          if (returnValue > 10) bgColor = 'bg-green-600';
                          else if (returnValue > 5) bgColor = 'bg-green-500';
                          else if (returnValue > 2) bgColor = 'bg-green-400';
                          else bgColor = 'bg-green-300';
                        } else if (returnValue < 0) {
                          if (returnValue < -10) bgColor = 'bg-red-600';
                          else if (returnValue < -5) bgColor = 'bg-red-500';
                          else if (returnValue < -2) bgColor = 'bg-red-400';
                          else bgColor = 'bg-red-300';
                        }

                        return (
                          <div
                            key={index}
                            className={`p-2 rounded ${bgColor} text-center`}
                            title={`${month.month}: ${formatPercent(month.return)}`}
                          >
                            <div className="text-xs font-medium">{month.month.split('-')[1]}</div>
                            <div className="text-sm">{formatPercent(month.return)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="bg-black/20 border-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Comparison
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BacktestingDashboard;
