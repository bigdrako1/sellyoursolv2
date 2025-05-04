
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ScatterChart, 
  Scatter, 
  Bar, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { calculateStrategyProfitability } from "@/utils/tradingUtils";
import { Button } from "@/components/ui/button";
import { Download, Filter, SlidersHorizontal, Share2 } from "lucide-react";
import { useState, useCallback } from "react";
import TradePerformanceGrade from "@/components/TradePerformanceGrade";

// Sample data for analytics
const STRATEGY_DATA = [
  { name: 'Front Running', pnl: 183.4, trades: 22, successRate: 78, avgHoldTime: 3.2 },
  { name: 'Market Runner', pnl: 92.7, trades: 14, successRate: 65, avgHoldTime: 12.8 },
  { name: 'Wallet Tracker', pnl: -30.8, trades: 5, successRate: 40, avgHoldTime: 8.4 },
];

const DAILY_PNL_DATA = [
  { name: 'Mon', pnl: 45.8 },
  { name: 'Tue', pnl: 32.3 },
  { name: 'Wed', pnl: -12.4 },
  { name: 'Thu', pnl: 67.2 },
  { name: 'Fri', pnl: 89.3 },
  { name: 'Sat', pnl: 21.6 },
  { name: 'Sun', pnl: 1.8 },
];

const ASSET_ALLOCATION = [
  { name: 'SOL', value: 35 },
  { name: 'SRUN', value: 25 },
  { name: 'FBOT', value: 15 },
  { name: 'Other', value: 5 },
];

const RISK_REWARD_DATA = [
  { name: 'Trade 1', risk: 2.1, reward: 5.4, amount: 180 },
  { name: 'Trade 2', risk: 1.8, reward: 4.2, amount: 120 },
  { name: 'Trade 3', risk: 3.2, reward: 2.8, amount: 240 },
  { name: 'Trade 4', risk: 1.5, reward: 6.8, amount: 300 },
  { name: 'Trade 5', risk: 2.8, reward: 5.2, amount: 210 },
  { name: 'Trade 6', risk: 4.2, reward: 3.7, amount: 150 },
  { name: 'Trade 7', risk: 1.9, reward: 7.2, amount: 280 },
];

// Sample performance metrics for grading
const PERFORMANCE_METRICS = {
  winRate: 68.5,
  profitFactor: 1.75,
  averageReturn: 0.029,
  maxDrawdown: 18.5,
  tradeFrequency: 42,
  successRate: 78,
  sharpeRatio: 1.32
};

const TradingAnalytics = () => {
  const [timeframe, setTimeframe] = useState("1w");
  const [activeTab, setActiveTab] = useState("performance");
  
  // Array of colors for charts
  const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f97316'];
  
  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
  }, []);
  
  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trading Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
            <Filter size={14} />
            <span>Filter</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
            <SlidersHorizontal size={14} />
            <span>Customize</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
            <Download size={14} />
          </Button>
          <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent border-white/10 hover:bg-white/10">
            <Share2 size={14} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="trading-card p-4">
          <h3 className="text-sm text-gray-400 mb-1">Total P&L</h3>
          <div className="text-2xl font-bold text-trading-success">+$245.32</div>
          <div className="text-xs text-gray-400 mt-1">
            <span className="text-trading-success">+18.4%</span> from initial capital
          </div>
        </Card>
        <Card className="trading-card p-4">
          <h3 className="text-sm text-gray-400 mb-1">Win/Loss Ratio</h3>
          <div className="text-2xl font-bold">2.8</div>
          <div className="text-xs text-gray-400 mt-1">
            29 wins / 11 losses
          </div>
        </Card>
        <Card className="trading-card p-4">
          <h3 className="text-sm text-gray-400 mb-1">Avg. Trade Profit</h3>
          <div className="text-2xl font-bold">$6.12</div>
          <div className="text-xs text-gray-400 mt-1">
            <span className="text-trading-success">+3.2%</span> per trade
          </div>
        </Card>
      </div>
      
      {/* New Performance Grade Component */}
      <TradePerformanceGrade metrics={PERFORMANCE_METRICS} />
      
      <Tabs defaultValue="performance" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-trading-darkAccent">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>
        
        <div className="mt-4">
          <div className="mb-4 flex justify-end">
            <div className="flex border border-gray-700 rounded-lg overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${timeframe === '1d' ? 'bg-trading-highlight text-white' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleTimeframeChange('1d')}
              >
                1D
              </button>
              <button 
                className={`px-3 py-1 text-sm ${timeframe === '1w' ? 'bg-trading-highlight text-white' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleTimeframeChange('1w')}
              >
                1W
              </button>
              <button 
                className={`px-3 py-1 text-sm ${timeframe === '1m' ? 'bg-trading-highlight text-white' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleTimeframeChange('1m')}
              >
                1M
              </button>
              <button 
                className={`px-3 py-1 text-sm ${timeframe === 'all' ? 'bg-trading-highlight text-white' : 'bg-transparent text-gray-400'}`}
                onClick={() => handleTimeframeChange('all')}
              >
                All
              </button>
            </div>
          </div>
          
          <TabsContent value="performance" className="mt-0">
            <Card className="trading-card p-4">
              <h3 className="font-bold mb-4">Daily P&L</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={DAILY_PNL_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" tick={{ fill: '#999' }} />
                    <YAxis tick={{ fill: '#999' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`$${value}`, 'P&L']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pnl" 
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1', r: 4 }}
                      activeDot={{ r: 6, fill: '#8b5cf6' }}
                      name="Profit/Loss"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="strategies" className="mt-0">
            <Card className="trading-card p-4">
              <h3 className="font-bold mb-4">Strategy Performance</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STRATEGY_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" tick={{ fill: '#999' }} />
                    <YAxis tick={{ fill: '#999' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'pnl') return [`$${value}`, 'P&L'];
                        if (name === 'successRate') return [`${value}%`, 'Success Rate'];
                        if (name === 'avgHoldTime') return [`${value}h`, 'Avg Hold Time'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pnl" fill="#6366f1" name="P&L ($)" />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate (%)" />
                    <Bar dataKey="avgHoldTime" fill="#f97316" name="Avg Hold Time (h)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="assets" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="trading-card p-4">
                <h3 className="font-bold mb-4">Asset Allocation</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ASSET_ALLOCATION}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {ASSET_ALLOCATION.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Allocation']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              
              <Card className="trading-card p-4">
                <h3 className="font-bold mb-4">Performance by Asset</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={[
                        { name: "SOL", performance: 12.3 },
                        { name: "SRUN", performance: 18.7 },
                        { name: "BNB", performance: 7.2 },
                        { name: "FBOT", performance: -4.8 },
                        { name: "Other", performance: 5.1 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis type="number" tick={{ fill: '#999' }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#999' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Performance']}
                      />
                      <Bar dataKey="performance">
                        {[
                          { name: "SOL", performance: 12.3 },
                          { name: "SRUN", performance: 18.7 },
                          { name: "BNB", performance: 7.2 },
                          { name: "FBOT", performance: -4.8 },
                          { name: "Other", performance: 5.1 }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.performance >= 0 ? '#10b981' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="mt-0">
            <Card className="trading-card p-4">
              <h3 className="font-bold mb-4">Risk/Reward Analysis</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis 
                      type="number" 
                      dataKey="risk" 
                      name="Risk" 
                      tick={{ fill: '#999' }}
                      label={{ value: 'Risk (%)', position: 'insideBottom', fill: '#999' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="reward" 
                      name="Reward" 
                      tick={{ fill: '#999' }}
                      label={{ value: 'Reward (%)', angle: -90, position: 'insideLeft', fill: '#999' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#333' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'risk') return [`${value}%`, 'Risk'];
                        if (name === 'reward') return [`${value}%`, 'Reward'];
                        if (name === 'amount') return [`$${value}`, 'Trade Amount'];
                        return [value, name];
                      }}
                    />
                    <Scatter 
                      name="Trades" 
                      data={RISK_REWARD_DATA} 
                      fill="#6366f1"
                    >
                      {RISK_REWARD_DATA.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.reward > entry.risk * 1.5 ? '#10b981' : entry.risk > entry.reward ? '#ef4444' : '#f97316'} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default TradingAnalytics;
