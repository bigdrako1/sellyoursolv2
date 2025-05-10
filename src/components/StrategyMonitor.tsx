import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Settings,
  Save,
  BarChart2,
  Percent,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Layers,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';

// Sample strategy performance data
const SAMPLE_STRATEGY_DATA = [
  {
    id: 'strategy-1',
    name: 'Front Running AI',
    enabled: true,
    performance: {
      daily: 2.3,
      weekly: 8.7,
      monthly: 15.2,
      total: 42.8
    },
    trades: {
      total: 87,
      successful: 62,
      failed: 25
    },
    riskLevel: 'High',
    lastOptimized: '2023-12-15T10:30:00Z',
    parameters: {
      sensitivity: 80,
      maxGasPrice: 50,
      slippageTolerance: 2,
      autoAdjustGas: true
    }
  },
  {
    id: 'strategy-2',
    name: 'Market Runner Detection',
    enabled: true,
    performance: {
      daily: 1.5,
      weekly: 5.2,
      monthly: 12.8,
      total: 36.5
    },
    trades: {
      total: 124,
      successful: 98,
      failed: 26
    },
    riskLevel: 'Medium',
    lastOptimized: '2023-12-10T14:45:00Z',
    parameters: {
      detectionThreshold: 70,
      reactionSpeed: 90,
      maxExposure: 20,
      timeToLive: 30
    }
  },
  {
    id: 'strategy-3',
    name: 'Wallet Activity Tracker',
    enabled: false,
    performance: {
      daily: 0,
      weekly: 3.8,
      monthly: 18.5,
      total: 45.2
    },
    trades: {
      total: 56,
      successful: 42,
      failed: 14
    },
    riskLevel: 'Medium',
    lastOptimized: '2023-12-05T09:15:00Z',
    parameters: {
      minimumBalance: 100000,
      copyThreshold: 60,
      delaySeconds: 5,
      maxWallets: 10
    }
  }
];

// Sample performance history data
const PERFORMANCE_HISTORY = [
  { date: '2023-12-01', frontRunning: 1.2, marketRunner: 0.8, walletTracker: 1.5 },
  { date: '2023-12-02', frontRunning: 0.5, marketRunner: 1.2, walletTracker: 0.7 },
  { date: '2023-12-03', frontRunning: -0.3, marketRunner: 0.6, walletTracker: 1.1 },
  { date: '2023-12-04', frontRunning: 0.8, marketRunner: 0.4, walletTracker: 0.3 },
  { date: '2023-12-05', frontRunning: 1.5, marketRunner: -0.2, walletTracker: 0.9 },
  { date: '2023-12-06', frontRunning: 0.7, marketRunner: 0.5, walletTracker: 1.2 },
  { date: '2023-12-07', frontRunning: 1.1, marketRunner: 0.9, walletTracker: 0.5 },
  { date: '2023-12-08', frontRunning: 0.4, marketRunner: 1.3, walletTracker: 0.8 },
  { date: '2023-12-09', frontRunning: 0.9, marketRunner: 0.7, walletTracker: 1.0 },
  { date: '2023-12-10', frontRunning: 1.3, marketRunner: 0.5, walletTracker: 0.6 },
  { date: '2023-12-11', frontRunning: 0.6, marketRunner: 1.1, walletTracker: 0.9 },
  { date: '2023-12-12', frontRunning: 1.0, marketRunner: 0.8, walletTracker: 1.3 },
  { date: '2023-12-13', frontRunning: 1.4, marketRunner: 0.6, walletTracker: 0.7 },
  { date: '2023-12-14', frontRunning: 0.8, marketRunner: 1.0, walletTracker: 1.1 }
];

// Sample optimization suggestions
const OPTIMIZATION_SUGGESTIONS = [
  {
    strategyId: 'strategy-1',
    suggestion: 'Increase sensitivity to 85 for better detection rate',
    expectedImprovement: 12,
    confidence: 'High',
    parameter: 'sensitivity',
    currentValue: 80,
    suggestedValue: 85
  },
  {
    strategyId: 'strategy-1',
    suggestion: 'Reduce slippage tolerance to 1.5% to improve execution price',
    expectedImprovement: 8,
    confidence: 'Medium',
    parameter: 'slippageTolerance',
    currentValue: 2,
    suggestedValue: 1.5
  },
  {
    strategyId: 'strategy-2',
    suggestion: 'Increase reaction speed to 95 for faster execution',
    expectedImprovement: 15,
    confidence: 'High',
    parameter: 'reactionSpeed',
    currentValue: 90,
    suggestedValue: 95
  }
];

interface StrategyMonitorProps {
  onStrategyUpdate?: (strategyId: string, enabled: boolean, parameters: any) => void;
}

const StrategyMonitor: React.FC<StrategyMonitorProps> = ({ onStrategyUpdate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [strategies, setStrategies] = useState(SAMPLE_STRATEGY_DATA);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [timeframe, setTimeframe] = useState('weekly');

  // Get the selected strategy data
  const selectedStrategyData = selectedStrategy
    ? strategies.find(s => s.id === selectedStrategy)
    : null;

  // Handle strategy toggle
  const handleStrategyToggle = (strategyId: string, enabled: boolean) => {
    const updatedStrategies = strategies.map(strategy =>
      strategy.id === strategyId ? { ...strategy, enabled } : strategy
    );

    setStrategies(updatedStrategies);

    toast({
      title: `Strategy ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `${updatedStrategies.find(s => s.id === strategyId)?.name} has been ${enabled ? 'enabled' : 'disabled'}.`,
    });

    if (onStrategyUpdate) {
      const strategy = updatedStrategies.find(s => s.id === strategyId);
      if (strategy) {
        onStrategyUpdate(strategyId, enabled, strategy.parameters);
      }
    }
  };

  // Handle parameter update
  const handleParameterUpdate = (strategyId: string, parameter: string, value: any) => {
    const updatedStrategies = strategies.map(strategy =>
      strategy.id === strategyId
        ? {
            ...strategy,
            parameters: {
              ...strategy.parameters,
              [parameter]: value
            }
          }
        : strategy
    );

    setStrategies(updatedStrategies);
  };

  // Handle optimization
  const handleOptimize = (strategyId: string) => {
    setIsOptimizing(true);
    setOptimizationProgress(0);

    // Simulate optimization process
    const interval = setInterval(() => {
      setOptimizationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsOptimizing(false);

          // Apply suggested optimizations
          const suggestions = OPTIMIZATION_SUGGESTIONS.filter(s => s.strategyId === strategyId);
          if (suggestions.length > 0) {
            const updatedStrategies = strategies.map(strategy => {
              if (strategy.id === strategyId) {
                const updatedParameters = { ...strategy.parameters };
                suggestions.forEach(suggestion => {
                  updatedParameters[suggestion.parameter] = suggestion.suggestedValue;
                });

                return {
                  ...strategy,
                  parameters: updatedParameters,
                  lastOptimized: new Date().toISOString()
                };
              }
              return strategy;
            });

            setStrategies(updatedStrategies);

            toast({
              title: 'Optimization Complete',
              description: `${updatedStrategies.find(s => s.id === strategyId)?.name} has been optimized with ${suggestions.length} improvements.`,
            });
          }

          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  // Get performance data for the selected timeframe
  const getPerformanceData = () => {
    switch (timeframe) {
      case 'daily':
        return PERFORMANCE_HISTORY.slice(-1);
      case 'weekly':
        return PERFORMANCE_HISTORY.slice(-7);
      case 'monthly':
        return PERFORMANCE_HISTORY;
      default:
        return PERFORMANCE_HISTORY;
    }
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Strategy Monitoring & Adaptation
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-black/20 border-white/10">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor, optimize and adapt your trading strategies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {strategies.map(strategy => (
                  <Card key={strategy.id} className="bg-black/20 border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${strategy.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                          <h3 className="font-medium">{strategy.name}</h3>
                          <Badge className={`${
                            strategy.riskLevel === 'High' ? 'bg-red-500' :
                            strategy.riskLevel === 'Medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}>
                            {strategy.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 bg-black/30 border-white/10"
                            onClick={() => setSelectedStrategy(strategy.id)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                          <Switch
                            checked={strategy.enabled}
                            onCheckedChange={(checked) => handleStrategyToggle(strategy.id, checked)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Daily</div>
                          <div className={`text-lg font-medium ${
                            strategy.performance.daily > 0 ? 'text-green-500' :
                            strategy.performance.daily < 0 ? 'text-red-500' :
                            'text-gray-400'
                          }`}>
                            {formatPercent(strategy.performance.daily)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1">Weekly</div>
                          <div className={`text-lg font-medium ${
                            strategy.performance.weekly > 0 ? 'text-green-500' :
                            strategy.performance.weekly < 0 ? 'text-red-500' :
                            'text-gray-400'
                          }`}>
                            {formatPercent(strategy.performance.weekly)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1">Monthly</div>
                          <div className={`text-lg font-medium ${
                            strategy.performance.monthly > 0 ? 'text-green-500' :
                            strategy.performance.monthly < 0 ? 'text-red-500' :
                            'text-gray-400'
                          }`}>
                            {formatPercent(strategy.performance.monthly)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                          <div className="text-lg font-medium">
                            {formatPercent(strategy.trades.successful / strategy.trades.total * 100)}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400">
                        Last optimized: {new Date(strategy.lastOptimized).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle>Strategy Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getPerformanceData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: '#999' }} />
                        <YAxis tick={{ fill: '#999' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                          formatter={(value: any) => [`${formatPercent(value)}`, '']}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="frontRunning"
                          name="Front Running AI"
                          stroke="#6366f1"
                          strokeWidth={2}
                          dot={{ fill: '#6366f1', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="marketRunner"
                          name="Market Runner Detection"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="walletTracker"
                          name="Wallet Activity Tracker"
                          stroke="#ec4899"
                          strokeWidth={2}
                          dot={{ fill: '#ec4899', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategies.map(strategy => (
                  <Card key={strategy.id} className="bg-black/20 border-white/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{strategy.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-400">Total Return</span>
                            <span className={`text-xs ${
                              strategy.performance.total > 0 ? 'text-green-500' :
                              strategy.performance.total < 0 ? 'text-red-500' :
                              'text-gray-400'
                            }`}>
                              {formatPercent(strategy.performance.total)}
                            </span>
                          </div>
                          <Progress
                            value={Math.min(100, Math.max(0, strategy.performance.total))}
                            max={100}
                            className="h-1.5"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-400">Win Rate</span>
                            <span className="text-xs">
                              {formatPercent(strategy.trades.successful / strategy.trades.total * 100)}
                            </span>
                          </div>
                          <Progress
                            value={strategy.trades.successful / strategy.trades.total * 100}
                            max={100}
                            className="h-1.5"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-gray-400">Total Trades</span>
                            <span className="text-xs">{strategy.trades.total}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-green-500">{strategy.trades.successful} successful</span>
                            <span className="text-gray-400">|</span>
                            <span className="text-red-500">{strategy.trades.failed} failed</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="optimization">
            <div className="space-y-6">
              {isOptimizing ? (
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Optimizing Strategy</CardTitle>
                    <CardDescription>
                      Please wait while we analyze and optimize your strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={optimizationProgress} max={100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Analyzing performance data...</span>
                        <span>{optimizationProgress}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {OPTIMIZATION_SUGGESTIONS.map((suggestion, index) => {
                    const strategy = strategies.find(s => s.id === suggestion.strategyId);
                    return (
                      <Card key={index} className="bg-black/20 border-white/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium mb-1">{strategy?.name}</h3>
                              <p className="text-sm text-gray-400">{suggestion.suggestion}</p>
                            </div>
                            <Badge className={`${
                              suggestion.confidence === 'High' ? 'bg-green-500' :
                              suggestion.confidence === 'Medium' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}>
                              {suggestion.confidence} Confidence
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Expected improvement: {suggestion.expectedImprovement}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Current: {suggestion.currentValue}</span>
                              <span className="text-xs text-gray-400">→</span>
                              <span className="text-xs text-green-500">Suggested: {suggestion.suggestedValue}</span>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-black/30 border-white/10"
                              onClick={() => handleParameterUpdate(
                                suggestion.strategyId,
                                suggestion.parameter,
                                suggestion.suggestedValue
                              )}
                            >
                              Apply
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 bg-black/30 border-white/10"
                              onClick={() => handleOptimize(suggestion.strategyId)}
                            >
                              Optimize All
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle>Strategy Performance Analytics</CardTitle>
                  <CardDescription>
                    Detailed analysis of strategy performance across different market conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-3">Performance by Market Condition</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { condition: 'Bull Market', frontRunning: 18.5, marketRunner: 12.3, walletTracker: 15.7 },
                            { condition: 'Bear Market', frontRunning: 5.2, marketRunner: 8.7, walletTracker: 3.1 },
                            { condition: 'Sideways', frontRunning: 7.8, marketRunner: 6.5, walletTracker: 9.2 },
                            { condition: 'High Vol', frontRunning: 22.3, marketRunner: 15.8, walletTracker: 12.5 },
                            { condition: 'Low Vol', frontRunning: 4.5, marketRunner: 7.2, walletTracker: 6.8 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="condition" tick={{ fill: '#999' }} />
                            <YAxis tick={{ fill: '#999' }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                              formatter={(value: any) => [`${value.toFixed(2)}%`, '']}
                            />
                            <Legend />
                            <Bar dataKey="frontRunning" name="Front Running AI" fill="#6366f1" />
                            <Bar dataKey="marketRunner" name="Market Runner" fill="#8b5cf6" />
                            <Bar dataKey="walletTracker" name="Wallet Tracker" fill="#ec4899" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-3">Win Rate by Time of Day</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={[
                            { hour: '00:00', frontRunning: 62, marketRunner: 58, walletTracker: 55 },
                            { hour: '04:00', frontRunning: 58, marketRunner: 62, walletTracker: 53 },
                            { hour: '08:00', frontRunning: 65, marketRunner: 70, walletTracker: 60 },
                            { hour: '12:00', frontRunning: 72, marketRunner: 68, walletTracker: 65 },
                            { hour: '16:00', frontRunning: 78, marketRunner: 72, walletTracker: 68 },
                            { hour: '20:00', frontRunning: 70, marketRunner: 65, walletTracker: 63 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="hour" tick={{ fill: '#999' }} />
                            <YAxis tick={{ fill: '#999' }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                              formatter={(value: any) => [`${value.toFixed(0)}%`, '']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="frontRunning" name="Front Running AI" stroke="#6366f1" strokeWidth={2} />
                            <Line type="monotone" dataKey="marketRunner" name="Market Runner" stroke="#8b5cf6" strokeWidth={2} />
                            <Line type="monotone" dataKey="walletTracker" name="Wallet Tracker" stroke="#ec4899" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle>Strategy Correlation Analysis</CardTitle>
                  <CardDescription>
                    Correlation between different strategies and market conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 px-3 text-sm font-medium text-gray-400">Strategy</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Front Running AI</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Market Runner</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Wallet Tracker</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">BTC Price</th>
                          <th className="text-right py-2 px-3 text-sm font-medium text-gray-400">Market Vol</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-sm">Front Running AI</td>
                          <td className="py-2 px-3 text-sm text-right">1.00</td>
                          <td className="py-2 px-3 text-sm text-right">0.45</td>
                          <td className="py-2 px-3 text-sm text-right">0.32</td>
                          <td className="py-2 px-3 text-sm text-right">0.28</td>
                          <td className="py-2 px-3 text-sm text-right">0.65</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-sm">Market Runner</td>
                          <td className="py-2 px-3 text-sm text-right">0.45</td>
                          <td className="py-2 px-3 text-sm text-right">1.00</td>
                          <td className="py-2 px-3 text-sm text-right">0.38</td>
                          <td className="py-2 px-3 text-sm text-right">0.52</td>
                          <td className="py-2 px-3 text-sm text-right">0.42</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-sm">Wallet Tracker</td>
                          <td className="py-2 px-3 text-sm text-right">0.32</td>
                          <td className="py-2 px-3 text-sm text-right">0.38</td>
                          <td className="py-2 px-3 text-sm text-right">1.00</td>
                          <td className="py-2 px-3 text-sm text-right">0.18</td>
                          <td className="py-2 px-3 text-sm text-right">0.25</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-sm">BTC Price</td>
                          <td className="py-2 px-3 text-sm text-right">0.28</td>
                          <td className="py-2 px-3 text-sm text-right">0.52</td>
                          <td className="py-2 px-3 text-sm text-right">0.18</td>
                          <td className="py-2 px-3 text-sm text-right">1.00</td>
                          <td className="py-2 px-3 text-sm text-right">0.35</td>
                        </tr>
                        <tr className="border-b border-white/5">
                          <td className="py-2 px-3 text-sm">Market Vol</td>
                          <td className="py-2 px-3 text-sm text-right">0.65</td>
                          <td className="py-2 px-3 text-sm text-right">0.42</td>
                          <td className="py-2 px-3 text-sm text-right">0.25</td>
                          <td className="py-2 px-3 text-sm text-right">0.35</td>
                          <td className="py-2 px-3 text-sm text-right">1.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 p-3 bg-black/30 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm mb-1">Strategy Diversification Insight</p>
                        <p className="text-xs text-gray-400">
                          Front Running AI and Market Vol have high correlation (0.65). Consider adjusting parameters to reduce correlation and improve portfolio diversification.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle>Strategy Execution Analysis</CardTitle>
                  <CardDescription>
                    Detailed analysis of strategy execution metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-black/30 border-white/5">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Execution Speed (ms)</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Front Running AI</span>
                              <span className="text-xs">125 ms</span>
                            </div>
                            <Progress value={125} max={500} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Market Runner</span>
                              <span className="text-xs">210 ms</span>
                            </div>
                            <Progress value={210} max={500} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Wallet Tracker</span>
                              <span className="text-xs">350 ms</span>
                            </div>
                            <Progress value={350} max={500} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/30 border-white/5">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Slippage (%)</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Front Running AI</span>
                              <span className="text-xs">0.8%</span>
                            </div>
                            <Progress value={0.8} max={3} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Market Runner</span>
                              <span className="text-xs">1.2%</span>
                            </div>
                            <Progress value={1.2} max={3} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Wallet Tracker</span>
                              <span className="text-xs">1.5%</span>
                            </div>
                            <Progress value={1.5} max={3} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/30 border-white/5">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-medium mb-3">Error Rate (%)</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Front Running AI</span>
                              <span className="text-xs">2.5%</span>
                            </div>
                            <Progress value={2.5} max={10} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Market Runner</span>
                              <span className="text-xs">4.8%</span>
                            </div>
                            <Progress value={4.8} max={10} className="h-1.5" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Wallet Tracker</span>
                              <span className="text-xs">3.2%</span>
                            </div>
                            <Progress value={3.2} max={10} className="h-1.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            {selectedStrategyData ? (
              <Card className="bg-black/20 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{selectedStrategyData.name} Settings</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 bg-black/30 border-white/10"
                      onClick={() => setSelectedStrategy(null)}
                    >
                      Back
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(selectedStrategyData.parameters).map(([key, value]) => {
                      if (typeof value === 'boolean') {
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <Label htmlFor={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                            <Switch
                              id={key}
                              checked={value as boolean}
                              onCheckedChange={(checked) => handleParameterUpdate(selectedStrategyData.id, key, checked)}
                            />
                          </div>
                        );
                      }

                      if (typeof value === 'number') {
                        return (
                          <div key={key}>
                            <Label htmlFor={key} className="capitalize mb-2 block">
                              {key.replace(/([A-Z])/g, ' $1')}: {value}
                            </Label>
                            <Slider
                              id={key}
                              min={0}
                              max={key.includes('Threshold') ? 100 : 200}
                              step={1}
                              value={[value as number]}
                              onValueChange={(newValue) => handleParameterUpdate(selectedStrategyData.id, key, newValue[0])}
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={key}>
                          <Label htmlFor={key} className="capitalize mb-2 block">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </Label>
                          <Input
                            id={key}
                            value={value as string}
                            onChange={(e) => handleParameterUpdate(selectedStrategyData.id, key, e.target.value)}
                            className="bg-black/30 border-white/10"
                          />
                        </div>
                      );
                    })}

                    <div className="pt-4 flex justify-end">
                      <Button onClick={() => {
                        toast({
                          title: 'Settings Saved',
                          description: `${selectedStrategyData.name} settings have been updated.`,
                        });

                        if (onStrategyUpdate) {
                          onStrategyUpdate(
                            selectedStrategyData.id,
                            selectedStrategyData.enabled,
                            selectedStrategyData.parameters
                          );
                        }
                      }}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a strategy to configure its settings.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StrategyMonitor;
