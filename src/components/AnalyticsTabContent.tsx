
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingAnalyticsDashboard from "@/components/TradingAnalyticsDashboard";
import RevenueTracker from "@/components/RevenueTracker";
import ScheduleAnalytics from "@/components/ScheduleAnalytics";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, Wallet, CalendarCheck } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

const AnalyticsTabContent = () => {
  const timeRange = useSettingsStore((state) => state.uiState.timeRange);
  const setTimeRange = useSettingsStore((state) => state.setTimeRange);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-500" />
              <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {timeRange === "7d" && (
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/20">
                  Last 7 Days
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 ${timeRange === "24h" ? "bg-purple-500/30 text-purple-300" : "bg-black/20"}`}
              onClick={() => setTimeRange("24h")}
            >
              24h
            </Badge>
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 ${timeRange === "7d" ? "bg-purple-500/30 text-purple-300" : "bg-black/20"}`}
              onClick={() => setTimeRange("7d")}
            >
              7d
            </Badge>
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 ${timeRange === "30d" ? "bg-purple-500/30 text-purple-300" : "bg-black/20"}`}
              onClick={() => setTimeRange("30d")}
            >
              30d
            </Badge>
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 ${timeRange === "all" ? "bg-purple-500/30 text-purple-300" : "bg-black/20"}`}
              onClick={() => setTimeRange("all")}
            >
              All Time
            </Badge>
          </div>
          
          <Tabs defaultValue="trades">
            <TabsList className="mb-4">
              <TabsTrigger value="trades" className="gap-1">
                <LineChart size={14} /> Trades
              </TabsTrigger>
              <TabsTrigger value="revenue" className="gap-1">
                <Wallet size={14} /> Revenue
              </TabsTrigger>
              <TabsTrigger value="schedule" className="gap-1">
                <CalendarCheck size={14} /> Schedule
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trades">
              <p className="text-muted-foreground mb-4">
                View your trade history and performance metrics for the last {timeRange === "24h" ? "24 hours" : 
                timeRange === "7d" ? "7 days" : 
                timeRange === "30d" ? "30 days" : "all time"}.
              </p>
              <TradingAnalyticsDashboard timeRange={timeRange} />
            </TabsContent>
            
            <TabsContent value="revenue">
              <p className="text-muted-foreground mb-4">
                Track your earnings and investment returns over time.
              </p>
              <RevenueTracker timeRange={timeRange} />
            </TabsContent>
            
            <TabsContent value="schedule">
              <p className="text-muted-foreground mb-4">
                View your trading activity by time and day for pattern analysis.
              </p>
              <ScheduleAnalytics timeRange={timeRange} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTabContent;
