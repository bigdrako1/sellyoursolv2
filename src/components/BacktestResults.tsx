import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BacktestResult, BacktestTrade } from "@/types/backtesting";
import { format } from "date-fns";
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  LineChart
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
  Legend
} from "recharts";
import { useCurrencyStore } from "@/store/currencyStore";

interface BacktestResultsProps {
  result: BacktestResult | null;
}

const BacktestResults: React.FC<BacktestResultsProps> = ({ result }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { currencySymbol } = useCurrencyStore();
  
  if (!result) {
    return null;
  }
  
  // Format dates
  const startDate = new Date(result.startTime);
  const endDate = new Date(result.endTime);
  
  // Format equity curve data for charts
  const equityCurveData = result.equityCurve.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    equity: point.equity
  }));
  
  // Format monthly returns for chart
  const monthlyReturnsData = result.monthlyReturns.map(point => ({
    month: format(new Date(point.date), "MMM yyyy"),
    return: point.return * 100
  }));
  
  // Calculate trade statistics
  const winningTrades = result.trades.filter(t => t.profit > 0);
  const losingTrades = result.trades.filter(t => t.profit < 0);
  const winRate = (winningTrades.length / result.trades.length) * 100;
  
  const avgWinAmount = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.profit, 0) / winningTrades.length 
    : 0;
    
  const avgLossAmount = losingTrades.length > 0 
    ? losingTrades.reduce((sum, t) => sum + t.profit, 0) / losingTrades.length 
    : 0;
  
  const profitFactor = Math.abs(avgLossAmount) > 0 
    ? Math.abs(avgWinAmount / avgLossAmount) 
    : winningTrades.length > 0 ? Infinity : 0;
  
  // Format trades for table
  const formattedTrades = result.trades.map(trade => ({
    ...trade,
    entryDate: new Date(trade.entryTime).toLocaleString(),
    exitDate: trade.exitTime ? new Date(trade.exitTime).toLocaleString() : "Open",
    profitFormatted: `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)} (${trade.profitPercentage.toFixed(2)}%)`
  }));
  
  return (
    <div className="space-y-6">
      <Card className="card-with-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-blue-400" />
            Backtest Results: {result.strategyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Period</div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>{format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}</span>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Total Return</div>
              <div className="flex items-center gap-1 font-medium">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className={result.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                  {result.totalProfit >= 0 ? "+" : ""}{result.totalProfit.toFixed(2)} ({result.totalProfitPercentage.toFixed(2)}%)
                </span>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Win Rate</div>
              <div className="flex items-center gap-1 font-medium">
                <Percent className="h-4 w-4 text-blue-400" />
                <span>{winRate.toFixed(2)}%</span>
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Max Drawdown</div>
              <div className="flex items-center gap-1 font-medium">
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-red-400">
                  -{result.maxDrawdownPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-black/20 border-white/10 border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="equity">Equity Curve</TabsTrigger>
              <TabsTrigger value="returns">Returns</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Performance Metrics</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Initial Capital</span>
                      <span>{currencySymbol}{result.initialCapital.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Final Capital</span>
                      <span>{currencySymbol}{result.finalCapital.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Total Profit/Loss</span>
                      <span className={result.totalProfit >= 0 ? "text-green-400" : "text-red-400"}>
                        {result.totalProfit >= 0 ? "+" : ""}{currencySymbol}{result.totalProfit.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Return %</span>
                      <span className={result.totalProfitPercentage >= 0 ? "text-green-400" : "text-red-400"}>
                        {result.totalProfitPercentage >= 0 ? "+" : ""}{result.totalProfitPercentage.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Sharpe Ratio</span>
                      <span>{result.sharpeRatio.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Max Drawdown</span>
                      <span className="text-red-400">-{result.maxDrawdownPercentage.toFixed(2)}%</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Profit Factor</span>
                      <span>{profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Trade Statistics</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Total Trades</span>
                      <span>{result.trades.length}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Winning Trades</span>
                      <span className="text-green-400">{winningTrades.length}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Losing Trades</span>
                      <span className="text-red-400">{losingTrades.length}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Win Rate</span>
                      <span>{winRate.toFixed(2)}%</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Avg. Winning Trade</span>
                      <span className="text-green-400">+{currencySymbol}{avgWinAmount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Avg. Losing Trade</span>
                      <span className="text-red-400">{currencySymbol}{avgLossAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-80 mt-6">
                <h3 className="text-lg font-medium mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurveData}>
                    <defs>
                      <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#9ca3af' }}
                      tickFormatter={(value) => value.substring(0, 5)}
                    />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#f9fafb'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorEquity)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="equity" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityCurveData}>
                    <defs>
                      <linearGradient id="colorEquity2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#f9fafb'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorEquity2)" 
                      name="Equity"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="returns" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturnsData}>
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#9ca3af' }}
                    />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        borderColor: '#374151',
                        color: '#f9fafb'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                    />
                    <Bar 
                      dataKey="return" 
                      fill={(data: any) => data.return >= 0 ? '#10b981' : '#ef4444'} 
                      name="Monthly Return (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="trades" className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-black/30 border-b border-white/10">
                      <th className="px-4 py-2 text-left">Entry Date</th>
                      <th className="px-4 py-2 text-left">Exit Date</th>
                      <th className="px-4 py-2 text-left">Direction</th>
                      <th className="px-4 py-2 text-right">Entry Price</th>
                      <th className="px-4 py-2 text-right">Exit Price</th>
                      <th className="px-4 py-2 text-right">Profit/Loss</th>
                      <th className="px-4 py-2 text-left">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedTrades.map((trade, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-2">{trade.entryDate}</td>
                        <td className="px-4 py-2">{trade.exitDate}</td>
                        <td className="px-4 py-2">
                          <Badge className={trade.direction === 'long' ? 'bg-green-600' : 'bg-red-600'}>
                            {trade.direction === 'long' ? 'Long' : 'Short'}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-right">{trade.entryPrice.toFixed(4)}</td>
                        <td className="px-4 py-2 text-right">{trade.exitPrice ? trade.exitPrice.toFixed(4) : '-'}</td>
                        <td className={`px-4 py-2 text-right ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.profitFormatted}
                        </td>
                        <td className="px-4 py-2">
                          {trade.exitReason ? (
                            <Badge variant="outline" className="capitalize">
                              {trade.exitReason.replace('_', ' ')}
                            </Badge>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BacktestResults;
