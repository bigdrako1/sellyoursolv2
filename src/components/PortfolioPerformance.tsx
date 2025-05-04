
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Loader2 } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-trading-darkAccent p-3 border border-white/10 rounded shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-trading-highlight">
          <span className="font-bold">${payload[0].value.toFixed(2)}</span>
          <span className="text-xs ml-1">Total</span>
        </p>
      </div>
    );
  }
  
  return null;
};

const PortfolioPerformance = () => {
  const [timeframe, setTimeframe] = useState("1m");
  const [isLoading, setIsLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  
  // Update data when timeframe changes
  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setIsLoading(true);
    
    // In a real app, we would fetch data from an API
    // For now, just show loading and then empty state
    setTimeout(() => {
      setPerformanceData([]);
      setIsLoading(false);
    }, 500);
  };
  
  // Calculate key metrics based on available data
  const startValue = performanceData.length > 0 ? performanceData[0]?.value || 0 : 0;
  const endValue = performanceData.length > 0 ? performanceData[performanceData.length - 1]?.value || 0 : 0;
  const absoluteChange = endValue - startValue;
  const percentChange = startValue > 0 ? (absoluteChange / startValue) * 100 : 0;
  
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
            <div className="text-xl font-bold">0.00%</div>
          </div>
        </div>
        
        <div className="h-80 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-trading-highlight mb-2" />
                <p className="text-sm text-gray-400">Loading performance data...</p>
              </div>
            </div>
          ) : performanceData.length > 0 ? (
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
                  name="Portfolio Value" 
                  stroke="#6366f1" 
                  fill="url(#totalGradient)"
                  strokeWidth={2}
                  activeDot={{ r: 4, fill: '#6366f1', stroke: 'white', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400">No portfolio performance data available</p>
                <p className="text-sm text-gray-500 mt-1">Connect your wallet to track portfolio performance</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PortfolioPerformance;
