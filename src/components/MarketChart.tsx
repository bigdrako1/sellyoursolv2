
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronUp, ChevronDown, BarChart2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getTokenPriceHistory } from "@/utils/marketUtils";

interface MarketChartProps {
  symbol: string;
  chain: "solana" | "binance";
}

interface PriceDataPoint {
  time: string;
  price: number;
  fullDate: Date;
}

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
  const [chartData, setChartData] = useState<PriceDataPoint[]>([]);
  const [priceChange, setPriceChange] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get days parameter based on timeframe
        const days = timeframe === "1h" ? 1/24 : timeframe === "1d" ? 1 : 7;
        
        // Get token symbol from the full symbol (e.g., SOL/USD -> SOL)
        const tokenSymbol = symbol.split('/')[0];
        
        // Fetch real data
        const priceHistory = await getTokenPriceHistory(tokenSymbol, days);
        
        if (priceHistory && priceHistory.length > 0) {
          setChartData(priceHistory);
          
          // Calculate price change percentage
          const startPrice = priceHistory[0].price;
          const endPrice = priceHistory[priceHistory.length - 1].price;
          const change = ((endPrice - startPrice) / startPrice) * 100;
          setPriceChange(change);
        } else {
          // If no data is available, use empty array
          setChartData([]);
          setPriceChange(0);
          setError("No price data available for this timeframe");
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError("Failed to load chart data");
        setChartData([]);
        setPriceChange(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [symbol, timeframe, chain]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price.toFixed(4) : "0.0000";
  const isPriceUp = priceChange >= 0;
  
  const gradientColor = isPriceUp ? 
    ['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0)'] : 
    ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)'];
  
  const strokeColor = isPriceUp ? '#10b981' : '#ef4444';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      );
    }
    
    if (error || chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <BarChart2 className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-400">
            {error || "No chart data available"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Try changing the timeframe or check back later
          </p>
        </div>
      );
    }
    
    return (
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
    );
  };

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
            {!isLoading && chartData.length > 0 && (
              <div className={`ml-2 flex items-center ${isPriceUp ? 'text-trading-success' : 'text-trading-danger'}`}>
                {isPriceUp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span className="text-sm font-medium">{Math.abs(priceChange).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="h-48 w-full">
          {renderContent()}
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
