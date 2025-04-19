
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface MarketChartProps {
  symbol: string;
  chain: "solana" | "binance";
}

const generateRandomData = (length: number, volatility: number) => {
  const startPrice = Math.random() * 100 + 50;
  let currentPrice = startPrice;
  const data = [];
  
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(0.1, currentPrice + change);
    
    // Format date for proper display
    const date = new Date(Date.now() - (length - i) * 60000);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    data.push({
      time: formattedTime,
      price: currentPrice,
      fullDate: date
    });
  }
  
  return data;
};

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-trading-darkAccent p-2 border border-white/10 rounded shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-trading-highlight">
          ${payload[0].value.toFixed(4)}
        </p>
      </div>
    );
  }

  return null;
};

const MarketChart = ({ symbol, chain }: MarketChartProps) => {
  const [timeframe, setTimeframe] = useState("1h");
  const [chartData, setChartData] = useState<any[]>([]);
  const [priceChange, setPriceChange] = useState(0);

  useEffect(() => {
    // Generate random chart data based on timeframe
    const dataPoints = timeframe === "1h" ? 60 : timeframe === "1d" ? 24 : 7;
    const volatility = timeframe === "1h" ? 2 : timeframe === "1d" ? 5 : 10;
    
    const data = generateRandomData(dataPoints, volatility);
    setChartData(data);
    
    // Calculate price change percentage
    if (data.length > 1) {
      const startPrice = data[0].price;
      const endPrice = data[data.length - 1].price;
      const change = ((endPrice - startPrice) / startPrice) * 100;
      setPriceChange(change);
    }
  }, [timeframe]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price.toFixed(4) : "0.0000";
  const isPriceUp = priceChange >= 0;
  
  const gradientColor = isPriceUp ? 
    ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0)'] : 
    ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)'];
  
  const strokeColor = isPriceUp ? '#10b981' : '#ef4444';

  return (
    <Card className="trading-card h-full">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${chain === "solana" ? "bg-solana" : "bg-binance"}`}></div>
            <h3 className="font-bold">{symbol}</h3>
            <span className="text-gray-400 text-sm">{chain === "solana" ? "SOL" : "BSC"}</span>
          </div>
          <div className="flex items-center">
            <span className="text-xl font-bold">${currentPrice}</span>
            <div className={`ml-2 flex items-center ${isPriceUp ? 'text-trading-success' : 'text-trading-danger'}`}>
              {isPriceUp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="text-sm font-medium">{Math.abs(priceChange).toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id={`colorGradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={gradientColor[0]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={gradientColor[1]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                minTickGap={20}
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
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#colorGradient-${symbol})`} 
                activeDot={{ r: 4, fill: strokeColor, stroke: 'white', strokeWidth: 1 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <Tabs defaultValue="1h" className="mt-4">
          <TabsList className="w-full bg-trading-dark">
            <TabsTrigger value="1h" onClick={() => setTimeframe("1h")} className="flex-1">1H</TabsTrigger>
            <TabsTrigger value="1d" onClick={() => setTimeframe("1d")} className="flex-1">1D</TabsTrigger>
            <TabsTrigger value="1w" onClick={() => setTimeframe("1w")} className="flex-1">1W</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
};

export default MarketChart;
