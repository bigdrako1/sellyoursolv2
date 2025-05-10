
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, Clock, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

// Sample data - in a real app this would come from an API or database
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Mock trading volume data by hour and day of week
const getTradeVolume = () => {
  const data: { [key: string]: number } = {};
  
  DAYS_OF_WEEK.forEach(day => {
    HOURS.forEach(hour => {
      // Generate weighted random volumes with more activity during market hours
      let volume = Math.random() * 1000;
      
      // Make weekends lighter
      if (day === "Sat" || day === "Sun") {
        volume *= 0.4;
      }
      
      // Make more activity during market hours (approx 9-17)
      if (hour >= 9 && hour <= 17) {
        volume *= 2.5;
      }
      
      // Evening hours moderate activity
      if (hour >= 18 && hour <= 22) {
        volume *= 1.5;
      }
      
      // Low activity overnight
      if (hour >= 23 || hour <= 5) {
        volume *= 0.3;
      }
      
      data[`${day}-${hour}`] = Math.round(volume);
    });
  });
  
  return data;
};

// Sample successful trades by hour
const getSuccessRatesByHour = () => {
  return HOURS.map(hour => {
    // More successful during market hours (approx 9-17)
    let rate = Math.random() * 30 + 50;
    if (hour >= 9 && hour <= 17) {
      rate += 10;
    }
    return {
      hour: hour,
      rate: Math.min(98, Math.round(rate))
    };
  });
};

// Sample trading performance by day of week
const getPerformanceByDay = () => {
  return DAYS_OF_WEEK.map(day => {
    // Weekend slightly worse performance
    let profit = Math.random() * 20 - 5;
    if (day === "Sat" || day === "Sun") {
      profit -= 2;
    }
    return {
      day,
      profit
    };
  });
};

interface ScheduleAnalyticsProps {
  timeRange: "24h" | "7d" | "30d" | "all";
}

const ScheduleAnalytics: React.FC<ScheduleAnalyticsProps> = ({ timeRange }) => {
  const volumeData = getTradeVolume();
  const successRates = getSuccessRatesByHour();
  const dayPerformance = getPerformanceByDay();
  
  // Get the max volume for scaling
  const maxVolume = Math.max(...Object.values(volumeData));
  
  const getIntensityClass = (volume: number) => {
    const intensity = volume / maxVolume;
    if (intensity > 0.8) return "bg-trading-success/90";
    if (intensity > 0.6) return "bg-trading-success/70";
    if (intensity > 0.4) return "bg-trading-success/50";
    if (intensity > 0.2) return "bg-trading-success/30";
    if (intensity > 0.1) return "bg-trading-success/20";
    return "bg-trading-success/10";
  };
  
  const formatTime = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h}${ampm}`;
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-trading-darkAccent border-trading-highlight/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-trading-highlight" />
            Trading Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-4">
            Displays your trading activity across days and times, showing when you're most active.
            The brighter the cell, the more trading activity during that period.
          </p>
          
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="flex">
                <div className="w-12"></div>
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex-1 text-center text-xs font-medium text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              
              {HOURS.filter(hour => hour % 2 === 0).map(hour => (
                <div key={hour} className="flex mt-1">
                  <div className="w-12 text-xs text-right pr-2 pt-1 text-gray-400">
                    {formatTime(hour)}
                  </div>
                  {DAYS_OF_WEEK.map(day => (
                    <div key={`${day}-${hour}`} className="flex-1 h-8">
                      <div 
                        className={`m-px h-full rounded ${getIntensityClass(volumeData[`${day}-${hour}`])}`}
                        title={`${day} ${formatTime(hour)}: ${volumeData[`${day}-${hour}`]} trades`}
                      ></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-400">Low Activity</div>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded bg-trading-success/10"></div>
              <div className="h-3 w-3 rounded bg-trading-success/30"></div>
              <div className="h-3 w-3 rounded bg-trading-success/50"></div>
              <div className="h-3 w-3 rounded bg-trading-success/70"></div>
              <div className="h-3 w-3 rounded bg-trading-success/90"></div>
            </div>
            <div className="text-xs text-gray-400">High Activity</div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-trading-highlight" />
              Success Rate by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Percentage of successful trades by hour of day over {timeRange === "24h" ? "the last 24 hours" : 
                timeRange === "7d" ? "the last week" : 
                timeRange === "30d" ? "the last month" : "all time"}.
            </p>
            
            <div className="space-y-2">
              {successRates.filter(item => item.hour % 3 === 0).map((item) => (
                <div key={item.hour} className="flex items-center">
                  <div className="w-12 text-xs text-gray-400">
                    {formatTime(item.hour)}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${item.rate > 75 ? 'bg-trading-success' : item.rate > 50 ? 'bg-amber-500' : 'bg-trading-danger'}`}
                        style={{ width: `${item.rate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-xs font-medium">
                    {item.rate}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-trading-highlight" />
              Profit by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400 mb-4">
              Average profit/loss percentage by day of week over {timeRange === "24h" ? "the last 24 hours" : 
                timeRange === "7d" ? "the last week" : 
                timeRange === "30d" ? "the last month" : "all time"}.
            </p>
            
            <div className="space-y-3">
              {dayPerformance.map((item) => (
                <div key={item.day} className="flex items-center">
                  <div className="w-12 text-xs font-medium text-gray-400">
                    {item.day}
                  </div>
                  <div className="flex-1 flex items-center">
                    {item.profit > 0 ? (
                      <div className="flex items-center">
                        <div 
                          className="h-8 bg-trading-success/30 rounded-l-sm" 
                          style={{ width: `${Math.abs(item.profit) * 5}px` }}
                        ></div>
                        <ArrowUpCircle className="h-5 w-5 text-trading-success ml-1" />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div 
                          className="h-8 bg-trading-danger/30 rounded-l-sm" 
                          style={{ width: `${Math.abs(item.profit) * 5}px` }}
                        ></div>
                        <ArrowDownCircle className="h-5 w-5 text-trading-danger ml-1" />
                      </div>
                    )}
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    <span className={item.profit > 0 ? 'text-trading-success' : 'text-trading-danger'}>
                      {item.profit > 0 ? '+' : ''}{item.profit.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScheduleAnalytics;
