
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDollarSign, TrendingUp, Calendar, ArrowUpRight, Wallet } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

// Sample revenue data - in a real app this would come from an API or database
const getRevenueData = (timeRange: string) => {
  // Simple mock data generation based on time range
  let factor = 1;
  let days = 7;
  
  switch(timeRange) {
    case "24h":
      days = 1;
      factor = 0.3;
      break;
    case "7d":
      days = 7;
      factor = 1;
      break;
    case "30d":
      days = 30;
      factor = 4;
      break;
    case "all":
      days = 90;
      factor = 12;
      break;
  }
  
  // Generate daily revenues
  const dailyRevenue: { date: string; amount: number; }[] = [];
  const today = new Date();
  let totalRevenue = 0;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    
    // Create some realistic looking revenue patterns
    let dayAmount = Math.random() * 200 * factor;
    
    // Weekends have less revenue
    if (date.getDay() === 0 || date.getDay() === 6) {
      dayAmount *= 0.6;
    }
    
    // Add some weekly patterns
    if (date.getDay() === 1) { // Mondays usually higher
      dayAmount *= 1.4;
    }
    
    const amount = Math.round(dayAmount);
    totalRevenue += amount;
    
    dailyRevenue.push({
      date: date.toISOString().split('T')[0],
      amount
    });
  }
  
  // Monthly breakdown
  const monthlyBreakdown = {
    trading: Math.round(totalRevenue * 0.65),
    monitoring: Math.round(totalRevenue * 0.25),
    services: Math.round(totalRevenue * 0.1)
  };
  
  return {
    totalRevenue,
    dailyRevenue,
    monthlyBreakdown,
    averageDaily: Math.round(totalRevenue / days),
    topDay: dailyRevenue.reduce((max, day) => day.amount > max.amount ? day : max, dailyRevenue[0]),
    growthRate: Math.round((Math.random() * 30) - 5) // -5% to +25%
  };
};

// Format currency based on the selected currency
const formatCurrency = (value: number, currency: string) => {
  const rates = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    JPY: { symbol: '¥', rate: 150.56 },
    KES: { symbol: 'KSh', rate: 129.45 }
  };
  
  const currencyInfo = rates[currency as keyof typeof rates] || rates.USD;
  return `${currencyInfo.symbol}${(value * currencyInfo.rate).toFixed(2)}`;
};

interface RevenueTrackerProps {
  timeRange: "24h" | "7d" | "30d" | "all";
}

const RevenueTracker: React.FC<RevenueTrackerProps> = ({ timeRange }) => {
  const { currency, currencySymbol } = useSettingsStore(state => ({
    currency: state.systemSettings.currency,
    currencySymbol: state.getUIState('currencySymbol')
  }));
  
  const revenueData = getRevenueData(timeRange);
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  // Calculate the maximum daily revenue for charting
  const maxDailyRevenue = Math.max(...revenueData.dailyRevenue.map(d => d.amount));
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(revenueData.totalRevenue, currency)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {timeRange === "24h" ? "Last 24 hours" : 
                    timeRange === "7d" ? "Last 7 days" : 
                    timeRange === "30d" ? "Last 30 days" : "All time"}
                </p>
              </div>
              <div className="bg-trading-success/20 h-12 w-12 rounded-full flex items-center justify-center">
                <BadgeDollarSign className="h-6 w-6 text-trading-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Average Daily</p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(revenueData.averageDaily, currency)}
                </h3>
                <div className="flex items-center text-xs mt-1">
                  <span className={revenueData.growthRate >= 0 ? 'text-trading-success' : 'text-trading-danger'}>
                    {revenueData.growthRate >= 0 ? '+' : ''}{revenueData.growthRate}%
                  </span>
                  <span className="text-gray-400 ml-1">vs previous period</span>
                </div>
              </div>
              <div className="bg-purple-500/20 h-12 w-12 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-400">Best Day</p>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(revenueData.topDay.amount, currency)}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {revenueData.topDay.date && formatDate(revenueData.topDay.date)}
                </p>
              </div>
              <div className="bg-amber-500/20 h-12 w-12 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-trading-darkAccent border-trading-highlight/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-trading-highlight" />
            Revenue History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-400 mb-4">
            Daily revenue over the selected time period
          </div>
          
          <div className="h-64 flex items-end gap-1">
            {revenueData.dailyRevenue.map((day, i) => (
              <div 
                key={i} 
                className="flex-1 group relative"
                title={`${formatDate(day.date)}: ${formatCurrency(day.amount, currency)}`}
              >
                <div 
                  className="w-full bg-trading-success/40 hover:bg-trading-success/50 rounded-t transition-all"
                  style={{ 
                    height: `${(day.amount / maxDailyRevenue) * 100}%`,
                    minHeight: '4px'
                  }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap transition-opacity">
                    {formatCurrency(day.amount, currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>{revenueData.dailyRevenue[0]?.date && formatDate(revenueData.dailyRevenue[0].date)}</span>
            <span>{revenueData.dailyRevenue[revenueData.dailyRevenue.length - 1]?.date && 
              formatDate(revenueData.dailyRevenue[revenueData.dailyRevenue.length - 1].date)}</span>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5 text-trading-highlight" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Trading Revenue</span>
                  <span className="font-medium">{formatCurrency(revenueData.monthlyBreakdown.trading, currency)}</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-trading-success rounded-full"
                    style={{ width: `${(revenueData.monthlyBreakdown.trading / revenueData.totalRevenue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((revenueData.monthlyBreakdown.trading / revenueData.totalRevenue) * 100)}% of total revenue
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monitoring Services</span>
                  <span className="font-medium">{formatCurrency(revenueData.monthlyBreakdown.monitoring, currency)}</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-amber-500 rounded-full"
                    style={{ width: `${(revenueData.monthlyBreakdown.monitoring / revenueData.totalRevenue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((revenueData.monthlyBreakdown.monitoring / revenueData.totalRevenue) * 100)}% of total revenue
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Additional Services</span>
                  <span className="font-medium">{formatCurrency(revenueData.monthlyBreakdown.services, currency)}</span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-purple-500 rounded-full"
                    style={{ width: `${(revenueData.monthlyBreakdown.services / revenueData.totalRevenue) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((revenueData.monthlyBreakdown.services / revenueData.totalRevenue) * 100)}% of total revenue
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
              <span className="text-sm">Total Revenue</span>
              <span className="font-bold">{formatCurrency(revenueData.totalRevenue, currency)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-trading-highlight" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">Average Trade Profit</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-trading-success">+4.3%</span>
                  <span className="text-sm text-gray-400 ml-2">per trade</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">68%</span>
                  <span className="text-sm text-gray-400 ml-2">of all trades</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">Average Position Size</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">{formatCurrency(28.75, currency)}</span>
                  <span className="text-sm text-gray-400 ml-2">per position</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="text-xs text-gray-400 mb-1">Average Holding Period</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">3.2</span>
                  <span className="text-sm text-gray-400 ml-2">hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueTracker;
