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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Shield,
  AlertTriangle,
  Settings,
  Save,
  BarChart2,
  Percent,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Layers
} from 'lucide-react';
import {
  calculatePositionSize,
  calculatePortfolioRisk,
  calculateVolatility,
  calculateCorrelation,
  PositionSizingModel,
  RiskProfile
} from '@/utils/riskManagementUtils';
import { formatCurrency, formatPercent, formatNumber } from '@/utils/formatters';
import { useTradingStore } from '@/store/tradingStore';

// Risk level colors
const RISK_COLORS = {
  low: '#10b981',    // Green
  medium: '#f59e0b', // Amber
  high: '#ef4444',   // Red
};

// Sample correlation data for visualization
const SAMPLE_CORRELATION_DATA = [
  { name: 'SOL', SOL: 1, BTC: 0.72, ETH: 0.68, BONK: 0.45, SAMO: 0.38 },
  { name: 'BTC', SOL: 0.72, BTC: 1, ETH: 0.85, BONK: 0.25, SAMO: 0.22 },
  { name: 'ETH', SOL: 0.68, ETH: 0.85, BTC: 1, BONK: 0.32, SAMO: 0.28 },
  { name: 'BONK', SOL: 0.45, BONK: 1, BTC: 0.25, ETH: 0.32, SAMO: 0.76 },
  { name: 'SAMO', SOL: 0.38, SAMO: 0.76, BTC: 0.22, ETH: 0.28, BONK: 1 }
];

const RiskManagementDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const { positions } = useTradingStore();

  // Risk profile state
  const [riskProfile, setRiskProfile] = useState<RiskProfile>({
    maxPositionSize: 20,
    maxDrawdown: 15,
    maxRiskPerTrade: 2,
    volatilityTolerance: 60,
    correlationLimit: 0.7,
    maxLeverage: 1,
    // Advanced risk parameters
    riskToRewardMinimum: 2,
    maxOpenPositions: 5,
    maxSectorExposure: 30,
    maxDailyLoss: 5,
    maxWeeklyLoss: 10,
    maxMonthlyLoss: 15,
    useAntiMartingale: true,
    useVolatilityFilters: true,
    useCorrelationFilters: true,
    usePositionSizing: true,
    useStopLoss: true,
    useTakeProfit: true,
    useTrailingStop: true
  });

  // Position sizing state
  const [positionSizing, setPositionSizing] = useState({
    availableCapital: 10000,
    riskPerTrade: 2,
    stopLossPercent: 10,
    volatility: 50,
    model: 'volatility_adjusted' as PositionSizingModel,
    calculatedSize: 0
  });

  // Portfolio risk metrics
  const [portfolioRisk, setPortfolioRisk] = useState({
    totalRisk: 0,
    maxPositionRisk: 0,
    riskConcentration: 0,
    diversificationScore: 0,
    positionRisks: []
  });

  // Calculate position size when inputs change
  useEffect(() => {
    const size = calculatePositionSize(
      positionSizing.availableCapital,
      positionSizing.riskPerTrade,
      positionSizing.stopLossPercent,
      positionSizing.volatility,
      positionSizing.model
    );

    setPositionSizing(prev => ({
      ...prev,
      calculatedSize: size
    }));
  }, [
    positionSizing.availableCapital,
    positionSizing.riskPerTrade,
    positionSizing.stopLossPercent,
    positionSizing.volatility,
    positionSizing.model
  ]);

  // Calculate portfolio risk when positions change
  useEffect(() => {
    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, pos) => sum + pos.currentAmount, 0) + 10000; // Add cash balance

    // Calculate risk metrics
    const riskMetrics = calculatePortfolioRisk(positions, totalValue);
    setPortfolioRisk(riskMetrics);
  }, [positions]);

  // Handle risk profile changes
  const handleRiskProfileChange = (field: keyof RiskProfile, value: number) => {
    setRiskProfile({
      ...riskProfile,
      [field]: value
    });
  };

  // Handle position sizing changes
  const handlePositionSizingChange = (field: string, value: any) => {
    setPositionSizing({
      ...positionSizing,
      [field]: value
    });
  };

  // Save risk profile
  const saveRiskProfile = () => {
    // In a real app, this would save to a database or store
    localStorage.setItem('risk_profile', JSON.stringify(riskProfile));

    toast({
      title: 'Risk Profile Saved',
      description: 'Your risk management settings have been saved',
    });
  };

  // Get risk level based on diversification score
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'Low', color: RISK_COLORS.low };
    if (score >= 40) return { level: 'Medium', color: RISK_COLORS.medium };
    return { level: 'High', color: RISK_COLORS.high };
  };

  // Prepare data for position allocation chart
  const positionAllocationData = portfolioRisk.positionRisks.length > 0
    ? [...portfolioRisk.positionRisks, {
        name: 'Cash',
        symbol: 'USD',
        value: positionSizing.availableCapital,
        riskPercent: (positionSizing.availableCapital / (positionSizing.availableCapital + positions.reduce((sum, pos) => sum + pos.currentAmount, 0))) * 100
      }]
    : [{ name: 'Cash', symbol: 'USD', value: positionSizing.availableCapital, riskPercent: 100 }];

  // Colors for pie chart
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#10b981', '#14b8a6'];

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management System
          </div>
          <Badge className={`bg-${getRiskLevel(portfolioRisk.diversificationScore).color}`}>
            {getRiskLevel(portfolioRisk.diversificationScore).level} Risk
          </Badge>
        </CardTitle>
        <CardDescription>
          Advanced risk management tools for optimizing trading performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="position-sizing">Position Sizing</TabsTrigger>
            <TabsTrigger value="correlation">Correlation</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-black/20 border-white/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Portfolio Risk</span>
                        <span className="text-2xl font-bold">
                          {formatPercent(portfolioRisk.totalRisk)}
                        </span>
                      </div>
                      <div className={`h-10 w-10 rounded-full bg-${getRiskLevel(100 - portfolioRisk.totalRisk).color}/20 flex items-center justify-center`}>
                        <Percent className={`h-5 w-5 text-${getRiskLevel(100 - portfolioRisk.totalRisk).color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Diversification</span>
                        <span className="text-2xl font-bold">
                          {formatPercent(portfolioRisk.diversificationScore)}
                        </span>
                      </div>
                      <div className={`h-10 w-10 rounded-full bg-${getRiskLevel(portfolioRisk.diversificationScore).color}/20 flex items-center justify-center`}>
                        <Layers className={`h-5 w-5 text-${getRiskLevel(portfolioRisk.diversificationScore).color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-400">Max Position Risk</span>
                        <span className="text-2xl font-bold">
                          {formatPercent(portfolioRisk.maxPositionRisk)}
                        </span>
                      </div>
                      <div className={`h-10 w-10 rounded-full bg-${getRiskLevel(100 - portfolioRisk.maxPositionRisk * 2).color}/20 flex items-center justify-center`}>
                        <AlertTriangle className={`h-5 w-5 text-${getRiskLevel(100 - portfolioRisk.maxPositionRisk * 2).color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Position Allocation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={positionAllocationData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="symbol"
                            label={({ symbol, value, percent }) => `${symbol}: ${formatPercent(percent * 100)}`}
                          >
                            {positionAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Risk Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Max Position Size</span>
                          <span className="text-sm">{riskProfile.maxPositionSize}%</span>
                        </div>
                        <Progress value={portfolioRisk.maxPositionRisk} max={riskProfile.maxPositionSize} className="h-2" />
                        <div className="flex justify-between mt-1 text-xs">
                          <span>Current: {formatPercent(portfolioRisk.maxPositionRisk)}</span>
                          <span className={portfolioRisk.maxPositionRisk > riskProfile.maxPositionSize ? 'text-red-500' : 'text-green-500'}>
                            {portfolioRisk.maxPositionRisk > riskProfile.maxPositionSize ? 'Exceeded' : 'Within Limit'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Max Drawdown</span>
                          <span className="text-sm">{riskProfile.maxDrawdown}%</span>
                        </div>
                        <Progress value={5} max={riskProfile.maxDrawdown} className="h-2" />
                        <div className="flex justify-between mt-1 text-xs">
                          <span>Current: 5%</span>
                          <span className="text-green-500">Within Limit</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Risk Per Trade</span>
                          <span className="text-sm">{riskProfile.maxRiskPerTrade}%</span>
                        </div>
                        <Progress value={positionSizing.riskPerTrade} max={riskProfile.maxRiskPerTrade} className="h-2" />
                        <div className="flex justify-between mt-1 text-xs">
                          <span>Current: {positionSizing.riskPerTrade}%</span>
                          <span className={positionSizing.riskPerTrade > riskProfile.maxRiskPerTrade ? 'text-red-500' : 'text-green-500'}>
                            {positionSizing.riskPerTrade > riskProfile.maxRiskPerTrade ? 'Exceeded' : 'Within Limit'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="position-sizing">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Position Size Calculator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="availableCapital">Available Capital</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="availableCapital"
                            type="number"
                            value={positionSizing.availableCapital}
                            onChange={(e) => handlePositionSizingChange('availableCapital', Number(e.target.value))}
                            className="bg-black/30 border-white/10"
                          />
                          <span className="text-xs text-gray-400">USD</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="riskPerTrade">Risk Per Trade (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="riskPerTrade"
                            type="number"
                            value={positionSizing.riskPerTrade}
                            onChange={(e) => handlePositionSizingChange('riskPerTrade', Number(e.target.value))}
                            className="bg-black/30 border-white/10"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="stopLossPercent">Stop Loss (%)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="stopLossPercent"
                            type="number"
                            value={positionSizing.stopLossPercent}
                            onChange={(e) => handlePositionSizingChange('stopLossPercent', Number(e.target.value))}
                            className="bg-black/30 border-white/10"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="volatility">Asset Volatility</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            id="volatility"
                            min={10}
                            max={100}
                            step={1}
                            value={[positionSizing.volatility]}
                            onValueChange={(value) => handlePositionSizingChange('volatility', value[0])}
                            className="my-2"
                          />
                          <span className="text-xs text-gray-400">{positionSizing.volatility}%</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="model">Position Sizing Model</Label>
                        <Select
                          value={positionSizing.model}
                          onValueChange={(value) => handlePositionSizingChange('model', value)}
                        >
                          <SelectTrigger className="bg-black/30 border-white/10">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Percentage</SelectItem>
                            <SelectItem value="volatility_adjusted">Volatility Adjusted</SelectItem>
                            <SelectItem value="kelly_criterion">Kelly Criterion</SelectItem>
                            <SelectItem value="optimal_f">Optimal f</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/5">
                  <CardHeader>
                    <CardTitle>Calculated Position Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-4xl font-bold mb-2">
                        {formatCurrency(positionSizing.calculatedSize)}
                      </div>
                      <div className="text-gray-400 mb-6">
                        Recommended position size
                      </div>

                      <div className="w-full space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">% of Capital</span>
                            <span className="text-sm">{formatPercent(positionSizing.calculatedSize / positionSizing.availableCapital * 100)}</span>
                          </div>
                          <Progress
                            value={positionSizing.calculatedSize / positionSizing.availableCapital * 100}
                            max={100}
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Risk Amount</span>
                            <span className="text-sm">{formatCurrency(positionSizing.availableCapital * (positionSizing.riskPerTrade / 100))}</span>
                          </div>
                        </div>

                        <div className="pt-4">
                          <div className="flex items-center p-3 bg-black/30 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="text-sm">
                              {positionSizing.model === 'volatility_adjusted'
                                ? 'Position size reduced due to high volatility.'
                                : positionSizing.model === 'kelly_criterion'
                                ? 'Using half-Kelly for more conservative sizing.'
                                : 'Adjust stop loss to manage risk exposure.'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="correlation">
            <Card className="bg-black/20 border-white/5">
              <CardHeader>
                <CardTitle>Asset Correlation Matrix</CardTitle>
                <CardDescription>
                  Correlation between different assets in your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={SAMPLE_CORRELATION_DATA}
                      margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" domain={[0, 1]} tick={{ fill: '#999' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#999' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                        formatter={(value: any) => [`${(value * 100).toFixed(0)}%`, 'Correlation']}
                      />
                      <Legend />
                      <Bar dataKey="SOL" stackId="a" fill="#6366f1" />
                      <Bar dataKey="BTC" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="ETH" stackId="a" fill="#ec4899" />
                      <Bar dataKey="BONK" stackId="a" fill="#f97316" />
                      <Bar dataKey="SAMO" stackId="a" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 bg-black/30 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm mb-1">High correlation detected between BTC and ETH (85%)</p>
                      <p className="text-xs text-gray-400">Consider diversifying to reduce portfolio correlation risk.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                  <TabsTrigger value="automation">Automation</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Basic Risk Parameters</CardTitle>
                      <CardDescription>
                        Configure your primary risk management settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="maxPositionSize">
                            Maximum Position Size: {riskProfile.maxPositionSize}%
                          </Label>
                          <Slider
                            id="maxPositionSize"
                            min={5}
                            max={50}
                            step={1}
                            value={[riskProfile.maxPositionSize]}
                            onValueChange={(value) => handleRiskProfileChange('maxPositionSize', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum percentage of portfolio allocated to a single position
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="maxDrawdown">
                            Maximum Drawdown: {riskProfile.maxDrawdown}%
                          </Label>
                          <Slider
                            id="maxDrawdown"
                            min={5}
                            max={30}
                            step={1}
                            value={[riskProfile.maxDrawdown]}
                            onValueChange={(value) => handleRiskProfileChange('maxDrawdown', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum acceptable drawdown before reducing position sizes
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="maxRiskPerTrade">
                            Maximum Risk Per Trade: {riskProfile.maxRiskPerTrade}%
                          </Label>
                          <Slider
                            id="maxRiskPerTrade"
                            min={0.5}
                            max={5}
                            step={0.5}
                            value={[riskProfile.maxRiskPerTrade]}
                            onValueChange={(value) => handleRiskProfileChange('maxRiskPerTrade', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum percentage of portfolio at risk in a single trade
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="volatilityTolerance">
                            Volatility Tolerance: {riskProfile.volatilityTolerance}%
                          </Label>
                          <Slider
                            id="volatilityTolerance"
                            min={20}
                            max={100}
                            step={5}
                            value={[riskProfile.volatilityTolerance]}
                            onValueChange={(value) => handleRiskProfileChange('volatilityTolerance', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Tolerance for asset volatility (higher = more tolerance)
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="correlationLimit">
                            Correlation Limit: {riskProfile.correlationLimit}
                          </Label>
                          <Slider
                            id="correlationLimit"
                            min={0.3}
                            max={1}
                            step={0.05}
                            value={[riskProfile.correlationLimit]}
                            onValueChange={(value) => handleRiskProfileChange('correlationLimit', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum acceptable correlation between assets
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced">
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Advanced Risk Parameters</CardTitle>
                      <CardDescription>
                        Fine-tune your risk management strategy with advanced settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="riskToRewardMinimum">
                            Minimum Risk-to-Reward Ratio: {riskProfile.riskToRewardMinimum}
                          </Label>
                          <Slider
                            id="riskToRewardMinimum"
                            min={1}
                            max={5}
                            step={0.5}
                            value={[riskProfile.riskToRewardMinimum]}
                            onValueChange={(value) => handleRiskProfileChange('riskToRewardMinimum', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Minimum reward-to-risk ratio required for new positions
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="maxOpenPositions">
                            Maximum Open Positions: {riskProfile.maxOpenPositions}
                          </Label>
                          <Slider
                            id="maxOpenPositions"
                            min={1}
                            max={20}
                            step={1}
                            value={[riskProfile.maxOpenPositions]}
                            onValueChange={(value) => handleRiskProfileChange('maxOpenPositions', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum number of positions that can be open simultaneously
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="maxSectorExposure">
                            Maximum Sector Exposure: {riskProfile.maxSectorExposure}%
                          </Label>
                          <Slider
                            id="maxSectorExposure"
                            min={10}
                            max={60}
                            step={5}
                            value={[riskProfile.maxSectorExposure]}
                            onValueChange={(value) => handleRiskProfileChange('maxSectorExposure', value[0])}
                            className="my-2"
                          />
                          <p className="text-xs text-gray-400">
                            Maximum exposure to a single market sector
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="maxDailyLoss">
                              Max Daily Loss: {riskProfile.maxDailyLoss}%
                            </Label>
                            <Slider
                              id="maxDailyLoss"
                              min={1}
                              max={10}
                              step={0.5}
                              value={[riskProfile.maxDailyLoss]}
                              onValueChange={(value) => handleRiskProfileChange('maxDailyLoss', value[0])}
                              className="my-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="maxWeeklyLoss">
                              Max Weekly Loss: {riskProfile.maxWeeklyLoss}%
                            </Label>
                            <Slider
                              id="maxWeeklyLoss"
                              min={2}
                              max={20}
                              step={1}
                              value={[riskProfile.maxWeeklyLoss]}
                              onValueChange={(value) => handleRiskProfileChange('maxWeeklyLoss', value[0])}
                              className="my-2"
                            />
                          </div>

                          <div>
                            <Label htmlFor="maxMonthlyLoss">
                              Max Monthly Loss: {riskProfile.maxMonthlyLoss}%
                            </Label>
                            <Slider
                              id="maxMonthlyLoss"
                              min={5}
                              max={30}
                              step={1}
                              value={[riskProfile.maxMonthlyLoss]}
                              onValueChange={(value) => handleRiskProfileChange('maxMonthlyLoss', value[0])}
                              className="my-2"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automation">
                  <Card className="bg-black/20 border-white/5">
                    <CardHeader>
                      <CardTitle>Risk Automation Settings</CardTitle>
                      <CardDescription>
                        Configure automated risk management features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useAntiMartingale"
                              checked={riskProfile.useAntiMartingale}
                              onCheckedChange={(checked) => handleRiskProfileChange('useAntiMartingale', checked)}
                            />
                            <Label htmlFor="useAntiMartingale">Anti-Martingale Position Scaling</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useVolatilityFilters"
                              checked={riskProfile.useVolatilityFilters}
                              onCheckedChange={(checked) => handleRiskProfileChange('useVolatilityFilters', checked)}
                            />
                            <Label htmlFor="useVolatilityFilters">Volatility-Based Filters</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useCorrelationFilters"
                              checked={riskProfile.useCorrelationFilters}
                              onCheckedChange={(checked) => handleRiskProfileChange('useCorrelationFilters', checked)}
                            />
                            <Label htmlFor="useCorrelationFilters">Correlation Filters</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="usePositionSizing"
                              checked={riskProfile.usePositionSizing}
                              onCheckedChange={(checked) => handleRiskProfileChange('usePositionSizing', checked)}
                            />
                            <Label htmlFor="usePositionSizing">Automated Position Sizing</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useStopLoss"
                              checked={riskProfile.useStopLoss}
                              onCheckedChange={(checked) => handleRiskProfileChange('useStopLoss', checked)}
                            />
                            <Label htmlFor="useStopLoss">Automated Stop Loss</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useTakeProfit"
                              checked={riskProfile.useTakeProfit}
                              onCheckedChange={(checked) => handleRiskProfileChange('useTakeProfit', checked)}
                            />
                            <Label htmlFor="useTakeProfit">Automated Take Profit</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="useTrailingStop"
                              checked={riskProfile.useTrailingStop}
                              onCheckedChange={(checked) => handleRiskProfileChange('useTrailingStop', checked)}
                            />
                            <Label htmlFor="useTrailingStop">Automated Trailing Stop</Label>
                          </div>
                        </div>

                        <div className="p-4 bg-black/30 rounded-lg mt-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm mb-1">Automation Safety Notice</p>
                              <p className="text-xs text-gray-400">
                                Automated risk management features will execute trades based on your settings.
                                Always monitor automated systems and be prepared to intervene manually if needed.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <Button onClick={saveRiskProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Risk Profile
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RiskManagementDashboard;
