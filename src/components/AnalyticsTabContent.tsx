
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingAnalyticsDashboard from "@/components/TradingAnalyticsDashboard";
import { Badge } from "@/components/ui/badge";
import { BarChart3, LineChart, PieChart, TrendingUp, Wallet, CalendarCheck } from "lucide-react";
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
              <TabsTrigger value="performance" className="gap-1">
                <TrendingUp size={14} /> Performance
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
            
            <TabsContent value="performance">
              <p className="text-muted-foreground mb-4">
                Analyze your portfolio performance and strategy effectiveness.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-64 flex flex-col items-center justify-center border border-dashed rounded-md p-4">
                  <PieChart size={48} className="text-purple-500 mb-2 opacity-50" />
                  <span className="text-muted-foreground text-center">Strategy performance breakdowns</span>
                </div>
                <div className="h-64 flex flex-col items-center justify-center border border-dashed rounded-md p-4">
                  <BarChart3 size={48} className="text-purple-500 mb-2 opacity-50" />
                  <span className="text-muted-foreground text-center">Token type performance comparison</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="revenue">
              <p className="text-muted-foreground mb-4">
                Track your earnings and investment returns over time.
              </p>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                <span className="text-muted-foreground">Revenue tracking features coming soon</span>
              </div>
            </TabsContent>
            
            <TabsContent value="schedule">
              <p className="text-muted-foreground mb-4">
                View your trading activity by time and day for pattern analysis.
              </p>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                <span className="text-muted-foreground">Trading schedule analytics coming soon</span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTabContent;
