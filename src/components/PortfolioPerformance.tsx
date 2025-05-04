
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

// Generate random historical portfolio data
const generateHistoricalData = (days: number, startValue = 3500, endValue = 4825.92) => {
  const data = [];
  let currentValue = startValue;
  const step = (endValue - startValue) / days;
  
  for (let i = 0; i < days; i++) {
    // Add a random fluctuation around the trend line
    const randomFactor = 0.98 + Math.random() * 0.04; // between 0.98 and 1.02
    currentValue = currentValue + step * randomFactor;
    
    // Create a date for each point
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    
    data.push({
      date: date.toISOString().slice(0, 10),
      value: currentValue,
      solana: currentValue * (0.55 + Math.random() * 0.1),
      binance: currentValue * (0.35 + Math.random() * 0.1),
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
          <span className="text-xs ml-1">Total</span>
        </p>
        {payload[1] && (
          <p className="text-sm text-solana-foreground">
            <span className="font-medium">${payload[1].value.toFixed(2)}</span>
            <span className="text-xs ml-1">Solana</span>
          </p>
        )}
        {payload[2] && (
          <p className="text-sm text-binance-foreground">
            <span className="font-medium">${payload[2].value.toFixed(2)}</span>
            <span className="text-xs ml-1">Binance</span>
          </p>
        )}
      </div>
    );
  }
  
  return null;
};

const PortfolioPerformance = () => {
  const [timeframe, setTimeframe] = useState("1m");
  const [performanceData, setPerformanceData] = useState(() => {
    const days = 
      timeframe === "1w" ? 7 : 
      timeframe === "1m" ? 30 : 
      timeframe === "3m" ? 90 : 365;
    
    return generateHistoricalData(days);
  });
  
  // Update data when timeframe changes
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    
    const days = 
      newTimeframe === "1w" ? 7 : 
      newTimeframe === "1m" ? 30 : 
      newTimeframe === "3m" ? 90 : 365;
    
    let startValue = 0;
    switch(newTimeframe) {
      case "1w": startValue = 4500; break;
      case "1m": startValue = 3900; break;
      case "3m": startValue = 3200; break;
      case "1y": startValue = 2500; break;
    }
    
    setPerformanceData(generateHistoricalData(days, startValue, 4825.92));
  };
  
  // Calculate key metrics
  const startValue = performanceData[0]?.value || 0;
  const endValue = performanceData[performanceData.length - 1]?.value || 0;
  const absoluteChange = endValue - startValue;
  const percentChange = (absoluteChange / startValue) * 100;
  
  // Calculate daily changes for volatility
  const dailyChanges = [];
  for (let i = 1; i < performanceData.length; i++) {
    const dailyChange = ((performanceData[i].value - performanceData[i-1].value) / performanceData[i-1].value) * 100;
    dailyChanges.push(dailyChange);
  }
  
  // Calculate metrics
  const averageDailyChange = dailyChanges.reduce((sum, val) => sum + val, 0) / dailyChanges.length;
  const volatility = Math.sqrt(dailyChanges.reduce((sum, val) => sum + Math.pow(val - averageDailyChange, 2), 0) / dailyChanges.length);
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="font-bold text-lg">Portfolio Performance</h3>
          <Tabs defaultValue={timeframe} className="w-auto">
            <TabsList className="bg-black/20">
              <TabsTrigger value="1w" onClick={() => handleTimeframeChange("1w")}>1W</TabsTrigger>
              <TabsTrigger value="1m" onClick={() => handleTimeframeChange("1m")}>1M</TabsTrigger>
              <TabsTrigger value="3m" onClick={() => handleTimeframeChange("3m")}>3M</TabsTrigger>
              <TabsTrigger value="1y" onClick={() => handleTimeframeChange("1y")}>1Y</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Starting Value</div>
            <div className="text-xl font-bold">${startValue.toFixed(2)}</div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Current Value</div>
            <div className="text-xl font-bold">${endValue.toFixed(2)}</div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Total Return</div>
            <div className={`text-xl font-bold ${percentChange >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
              {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-black/20 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Volatility</div>
            <div className="text-xl font-bold">{volatility.toFixed(2)}%</div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={performanceData}
              margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
            >
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="solanaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14f195" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14f195" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="binanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f0b90b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f0b90b" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="value" 
                name="Total Value" 
                stroke="#6366f1" 
                fill="url(#totalGradient)"
                strokeWidth={2}
                activeDot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 1 }}
                stackId="1"
              />
              <Area 
                type="monotone" 
                dataKey="solana" 
                name="Solana Assets" 
                stroke="#14f195" 
                fill="url(#solanaGradient)"
                strokeWidth={1.5}
                activeDot={{ r: 4, fill: '#14f195', stroke: 'white', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="binance" 
                name="Binance Assets" 
                stroke="#f0b90b" 
                fill="url(#binanceGradient)"
                strokeWidth={1.5}
                activeDot={{ r: 4, fill: '#f0b90b', stroke: 'white', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioPerformance;
