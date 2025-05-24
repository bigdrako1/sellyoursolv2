import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Zap,
  BarChart2,
  Clock,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bot,
  LayoutDashboard,
  LineChart,
  Activity,
  DollarSign,
  Percent,
  Coins,
  Shield,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useSettingsStore } from "@/store/settingsStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { Link } from "react-router-dom";
import APP_CONFIG from "@/config/appDefinition";
import SystemControls from "@/components/SystemControls";
import { TradeAlerts } from "@/components/alerts";
import ConnectedServices from "@/components/ConnectedServices";
import TradingTabContent from "@/components/TradingTabContent";
import WalletsTabContent from "@/components/WalletsTabContent";
import { WalletTracker } from "@/components/wallet";
import SmartMoneyDetection from "@/components/SmartMoneyDetection";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

// Mock data for charts
const performanceData = [
  { date: "Jan 1", value: 1000, benchmark: 1000 },
  { date: "Jan 5", value: 1050, benchmark: 1020 },
  { date: "Jan 10", value: 1025, benchmark: 1015 },
  { date: "Jan 15", value: 1100, benchmark: 1030 },
  { date: "Jan 20", value: 1150, benchmark: 1050 },
  { date: "Jan 25", value: 1200, benchmark: 1070 },
  { date: "Jan 30", value: 1180, benchmark: 1080 },
  { date: "Feb 5", value: 1250, benchmark: 1100 },
  { date: "Feb 10", value: 1300, benchmark: 1120 },
  { date: "Feb 15", value: 1280, benchmark: 1110 },
  { date: "Feb 20", value: 1350, benchmark: 1130 },
  { date: "Feb 25", value: 1400, benchmark: 1150 },
  { date: "Mar 1", value: 1450, benchmark: 1170 },
];

const tokenAllocation = [
  { name: "SOL", value: 45 },
  { name: "BONK", value: 20 },
  { name: "JUP", value: 15 },
  { name: "PYTH", value: 10 },
  { name: "Others", value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const recentTrades = [
  { id: 1, token: "SOL", type: "buy", amount: 2.5, price: 142.75, date: "2023-03-01", profit: null },
  { id: 2, token: "BONK", type: "sell", amount: 15000000, price: 0.00000235, date: "2023-02-28", profit: 12.5 },
  { id: 3, token: "JUP", type: "buy", amount: 100, price: 1.85, date: "2023-02-27", profit: null },
  { id: 4, token: "PYTH", type: "sell", amount: 50, price: 0.95, date: "2023-02-26", profit: -5.2 },
];

const ConsolidatedDashboard: React.FC = () => {
  const { isAuthenticated, walletAddress, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeframe, setTimeframe] = useState("1m");
  const systemActive = useSettingsStore((state) => state.systemSettings.systemActive);
  const setSystemActive = useSettingsStore((state) => state.setSystemActive);
  const { currencySymbol } = useCurrencyStore();

  const toggleSystemActive = () => setSystemActive(!systemActive);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-trading-darkAccent p-3 border border-white/10 rounded shadow-lg">
          <p className="text-sm font-medium mb-1">{label}</p>
          <p className="text-sm text-blue-400">
            <span className="font-bold">{currencySymbol}{payload[0].value.toFixed(2)}</span>
            <span className="text-xs ml-1">Portfolio</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-gray-400">
              <span className="font-bold">{currencySymbol}{payload[1].value.toFixed(2)}</span>
              <span className="text-xs ml-1">Benchmark</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/20 border-white/10 border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8">
          {/* Hero Section */}
          <div className="text-center py-12 px-4 bg-black/20 rounded-lg border border-white/5">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              Autonomous, AFK-capable trading system for Solana
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              Supercharge your wallet to begin trading with advanced AI strategies.
            </p>

            <div className="inline-flex items-center bg-black/30 rounded-lg p-2 mb-6">
              <div className="flex items-center space-x-2 px-3 py-1">
                <Bot className="text-purple-400" size={18} />
                <span className="font-mono text-sm">ASFL_alpha</span>
                <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
                  v1
                </Badge>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="ml-4"
                onClick={async () => {
                  try {
                    await signOut();
                    toast.success("Wallet disconnected successfully");
                  } catch (error) {
                    console.error("Error disconnecting wallet:", error);
                    toast.error("Failed to disconnect wallet");
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Portfolio</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">{currencySymbol}1,450.00</h3>
                      <span className="ml-2 text-sm flex items-center text-green-500">
                        <ArrowUpRight size={16} />
                        +45.0%
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <DollarSign className="text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">78.5%</h3>
                      <span className="ml-2 text-sm text-gray-400">
                        (51/65)
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Percent className="text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Positions</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">3</h3>
                      <span className="ml-2 text-sm text-gray-400">
                        positions
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <Activity className="text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg. Hold Time</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">3.2</h3>
                      <span className="ml-2 text-sm text-gray-400">
                        days
                      </span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-amber-500/20">
                    <Clock className="text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI-Powered Trading */}
            <Card className="bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-purple-900/30 flex items-center justify-center mb-4">
                    <Brain className="text-purple-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-purple-400">AI-Powered Trading</h3>
                  <p className="text-gray-400 text-sm">
                    Our algorithms adapt to market conditions and execute optimal trades automatically.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-black/20 border-white/10 mt-4"
                    onClick={() => setActiveTab("trading")}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Configure Trading
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Management */}
            <Card className="bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-blue-900/30 flex items-center justify-center mb-4">
                    <BarChart2 className="text-blue-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-blue-400">Portfolio Management</h3>
                  <p className="text-gray-400 text-sm">
                    Track assets, monitor performance, and optimize your portfolio.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-black/20 border-white/10 mt-4"
                    onClick={() => setActiveTab("analytics")}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 24/7 Automation */}
            <Card className="bg-black/20 border border-white/5 hover:bg-black/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-lg bg-green-900/30 flex items-center justify-center mb-4">
                    <Clock className="text-green-400" size={24} />
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-green-400">24/7 Automation</h3>
                  <p className="text-gray-400 text-sm">
                    Set your strategy once and let our system handle the rest.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-black/20 border-white/10 mt-4"
                    onClick={() => setActiveTab("wallets")}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Track Wallets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <SystemControls
                systemActive={systemActive}
                toggleSystemActive={toggleSystemActive}
                showFullControls={true}
              />
            </div>
            <TradeAlerts />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Sharpe Ratio</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">2.34</h3>
                      <span className="ml-2 text-sm text-green-500">Excellent</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-purple-500/20">
                    <TrendingUp className="text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Max Drawdown</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">-8.2%</h3>
                      <span className="ml-2 text-sm text-green-500">Low Risk</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-red-500/20">
                    <ArrowDownRight className="text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Trade Size</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">0.85</h3>
                      <span className="ml-2 text-sm text-gray-400">SOL</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-blue-500/20">
                    <Coins className="text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-trading-darkAccent border-white/5">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Volatility</p>
                    <div className="flex items-baseline mt-1">
                      <h3 className="text-2xl font-bold">12.4%</h3>
                      <span className="ml-2 text-sm text-yellow-500">Moderate</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-full bg-yellow-500/20">
                    <Activity className="text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-400" />
                    Portfolio Performance vs Benchmark
                  </CardTitle>
                  <CardDescription>
                    Track your portfolio performance against SOL and market benchmarks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#9ca3af' }}
                        />
                        <YAxis
                          tick={{ fill: '#9ca3af' }}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                          name="Portfolio"
                        />
                        <Line
                          type="monotone"
                          dataKey="benchmark"
                          stroke="#9ca3af"
                          strokeDasharray="5 5"
                          name="Benchmark"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Allocation</CardTitle>
                  <CardDescription>Current portfolio distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tokenAllocation}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {tokenAllocation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-green-400" />
                    Trading Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Best Performing Token</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500/20 text-green-400">BONK</Badge>
                      <span className="text-sm text-green-400">+127%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Most Traded Token</span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500/20 text-blue-400">SOL</Badge>
                      <span className="text-sm">23 trades</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Avg Hold Time</span>
                    <span className="text-sm">3.2 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Success Rate</span>
                    <span className="text-sm text-green-400">78.5%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-white/5">
                      <th className="px-4 py-2 text-left">Token</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Date</th>
                      <th className="px-4 py-2 text-right">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map((trade) => (
                      <tr key={trade.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-medium">{trade.token}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={trade.type === "buy" ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}>
                            {trade.type.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.amount.toLocaleString(undefined, {
                            maximumFractionDigits: trade.amount > 1000 ? 0 : 2
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          ${trade.price.toLocaleString(undefined, {
                            minimumFractionDigits: trade.price < 0.01 ? 8 : 2,
                            maximumFractionDigits: trade.price < 0.01 ? 8 : 2
                          })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.date}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {trade.profit !== null ? (
                            <span className={trade.profit >= 0 ? "text-green-500" : "text-red-500"}>
                              {trade.profit >= 0 ? "+" : ""}{trade.profit}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Auto Trading Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TradingTabContent />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="risk-level">Risk Level</Label>
                      <Slider
                        id="risk-level"
                        min={10}
                        max={90}
                        step={10}
                        defaultValue={[50]}
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Conservative</span>
                        <span>Aggressive</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <Label htmlFor="stop-loss">Automatic Stop Loss</Label>
                      </div>
                      <Switch id="stop-loss" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-blue-400" />
                        <Label htmlFor="auto-rebalance">Auto Rebalance</Label>
                      </div>
                      <Switch id="auto-rebalance" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TradeAlerts />
            </div>
          </div>


        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-500" />
                    Wallet Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletsTabContent />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Wallet Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WalletTracker />
                </CardContent>
              </Card>

              <SmartMoneyDetection />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsolidatedDashboard;
