
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChevronUp, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { convertUsdToCurrency, formatCurrency } from "@/utils/currencyUtils";

const CustomTooltip = ({ active, payload, label }: any) => {
  const { currency, currencySymbol } = useCurrencyStore();

  if (active && payload && payload.length) {
    return (
      <div className="bg-trading-darkAccent p-3 border border-white/10 rounded shadow-lg">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-sm text-trading-highlight">
          <span className="font-bold">
            {formatCurrency(payload[0].value, currency, currencySymbol, { maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs ml-1">Portfolio Value</span>
        </p>
        {payload[1] && (
          <p className="text-sm text-gray-400">
            <span className="font-medium">
              {formatCurrency(payload[1].value, currency, currencySymbol, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs ml-1">Market Benchmark</span>
          </p>
        )}
      </div>
    );
  }

  return null;
};

const PerformanceMetrics = () => {
  const { currency, currencySymbol } = useCurrencyStore();
  const [timeframe, setTimeframe] = useState("1m");
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [performanceStats, setPerformanceStats] = useState({
    totalGrowth: 0,
    averageDailyReturn: 0,
    winRate: 0,
    sharpeRatio: 0
  });

  // Format currency with symbol and proper formatting
  const formatCurrencyValue = (value: number, options = {}): string => {
    return formatCurrency(value, currency, currencySymbol, options);
  };

  // Handle timeframe change
  const fetchPerformanceData = (newTimeframe: string) => {
    setTimeframe(newTimeframe);
    setLoading(true);

    // In a real app, this would fetch data from an API
    // For now, just show empty state after loading
    setTimeout(() => {
      setPerformanceData([]);
      setPerformanceStats({
        totalGrowth: 0,
        averageDailyReturn: 0,
        winRate: 0,
        sharpeRatio: 0
      });
      setLoading(false);
    }, 500);
  };

  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Performance Metrics</h3>
          <Tabs defaultValue="1m" className="w-auto">
            <TabsList className="bg-trading-dark">
              <TabsTrigger value="1w" onClick={() => fetchPerformanceData("1w")}>1W</TabsTrigger>
              <TabsTrigger value="1m" onClick={() => fetchPerformanceData("1m")}>1M</TabsTrigger>
              <TabsTrigger value="3m" onClick={() => fetchPerformanceData("3m")}>3M</TabsTrigger>
              <TabsTrigger value="1y" onClick={() => fetchPerformanceData("1y")}>1Y</TabsTrigger>
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
              {performanceStats.sharpeRatio > 0 && (
                <TrendingUp size={16} className="text-trading-highlight ml-1" />
              )}
            </div>
          </div>
        </div>

        <div className="h-60 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
              <p className="text-sm text-gray-400">Loading performance metrics...</p>
            </div>
          ) : performanceData.length > 0 ? (
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
                  width={50}
                  tickFormatter={(value) => {
                    const convertedValue = convertUsdToCurrency(value, currency);
                    return `${currencySymbol}${convertedValue.toFixed(0)}`;
                  }}
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-400">No performance data available</p>
                <p className="text-sm text-gray-500 mt-1">Connect your wallet to track your performance</p>
              </div>
            </div>
          )}
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
