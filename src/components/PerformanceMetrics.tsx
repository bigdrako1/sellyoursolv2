
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronUp, TrendingUp, ArrowRight } from "lucide-react";

// Generate random performance data
const generatePerformanceData = (days: number, startValue = 1000, volatility = 0.03, trend = 0.005) => {
  const data = [];
  let currentValue = startValue;
  
  for (let i = 0; i < days; i++) {
    // Add a random change with a slight upward trend
    const change = (Math.random() * 2 - 1) * volatility + trend;
    currentValue = Math.max(1, currentValue * (1 + change));
    
    // Create a date for each point
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    
    data.push({
      date: date.toISOString().slice(0, 10),
      value: currentValue,
      comparative: startValue * (1 + (i * 0.003))
    });
  }
  
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-trading-darkAccent p-3 border border-white/10 rounded shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-trading-highlight">
          <span className="font-bold">${payload[0].value.toFixed(2)}</span>
          <span className="text-xs ml-1">Portfolio Value</span>
        </p>
        <p className="text-sm text-gray-400">
          <span className="font-medium">${payload[1].value.toFixed(2)}</span>
          <span className="text-xs ml-1">Market Benchmark</span>
        </p>
      </div>
    );
  }
  
  return null;
};

const PerformanceMetrics = () => {
  const [timeframe, setTimeframe] = useState("1m");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [performanceStats, setPerformanceStats] = useState({
    totalGrowth: 0,
    averageDailyReturn: 0,
    winRate: 0,
    sharpeRatio: 0
  });
  
  useEffect(() => {
    // Generate data based on timeframe
    const days = 
      timeframe === "1w" ? 7 : 
      timeframe === "1m" ? 30 : 
      timeframe === "3m" ? 90 : 365;
    
    const trend = 
      timeframe === "1w" ? 0.008 : 
      timeframe === "1m" ? 0.006 : 
      timeframe === "3m" ? 0.005 : 0.004;
    
    const data = generatePerformanceData(days, 1000, 0.03, trend);
    setPerformanceData(data);
    
    // Calculate stats
    if (data.length > 0) {
      const startValue = data[0].value;
      const endValue = data[data.length - 1].value;
      const totalGrowth = ((endValue - startValue) / startValue) * 100;
      
      // Calculate daily returns
      const dailyReturns = [];
      for (let i = 1; i < data.length; i++) {
        const returnValue = (data[i].value - data[i-1].value) / data[i-1].value;
        dailyReturns.push(returnValue);
      }
      
      const averageDailyReturn = (dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length) * 100;
      const winRate = (dailyReturns.filter(r => r > 0).length / dailyReturns.length) * 100;
      
      // Simple Sharpe ratio calculation (not fully accurate without risk-free rate)
      const returnMean = dailyReturns.reduce((sum, val) => sum + val, 0) / dailyReturns.length;
      const stdDev = Math.sqrt(
        dailyReturns.reduce((sum, val) => sum + Math.pow(val - returnMean, 2), 0) / dailyReturns.length
      );
      const sharpeRatio = (returnMean / stdDev) * Math.sqrt(252); // Annualized
      
      setPerformanceStats({
        totalGrowth,
        averageDailyReturn,
        winRate,
        sharpeRatio
      });
    }
  }, [timeframe]);
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Performance Metrics</h3>
          <Tabs defaultValue="1m" className="w-auto">
            <TabsList className="bg-trading-dark">
              <TabsTrigger value="1w" onClick={() => setTimeframe("1w")}>1W</TabsTrigger>
              <TabsTrigger value="1m" onClick={() => setTimeframe("1m")}>1M</TabsTrigger>
              <TabsTrigger value="3m" onClick={() => setTimeframe("3m")}>3M</TabsTrigger>
              <TabsTrigger value="1y" onClick={() => setTimeframe("1y")}>1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Total Growth</div>
            <div className="flex items-center">
              <div className="text-xl font-bold">{performanceStats.totalGrowth.toFixed(2)}%</div>
              {performanceStats.totalGrowth > 0 && (
                <ChevronUp size={16} className="text-trading-success ml-1" />
              )}
            </div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Daily Return</div>
            <div className="text-xl font-bold">{performanceStats.averageDailyReturn.toFixed(2)}%</div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold">{performanceStats.winRate.toFixed(1)}%</div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Sharpe Ratio</div>
            <div className="flex items-center">
              <div className="text-xl font-bold">{performanceStats.sharpeRatio.toFixed(2)}</div>
              <TrendingUp size={16} className="text-trading-highlight ml-1" />
            </div>
          </div>
        </div>
        
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={performanceData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle" 
                iconSize={8}
                wrapperStyle={{ fontSize: '12px', bottom: 0 }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                name="Portfolio Performance" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="comparative" 
                name="Market Benchmark" 
                stroke="#9ca3af" 
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                activeDot={{ r: 4, fill: '#9ca3af', stroke: 'white', strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-end mt-3">
          <div className="flex items-center text-trading-highlight text-sm cursor-pointer">
            View Detailed Analytics <ArrowRight size={14} className="ml-1" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PerformanceMetrics;
