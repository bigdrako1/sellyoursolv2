
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradingAnalyticsDashboard from "@/components/TradingAnalyticsDashboard";
import { BarChart3, LineChart, PieChart } from "lucide-react";

const AnalyticsTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-purple-500" />
            <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          </div>
          
          <Tabs defaultValue="trades">
            <TabsList className="mb-4">
              <TabsTrigger value="trades" className="gap-1">
                <LineChart size={14} /> Trades
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-1">
                <PieChart size={14} /> Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trades">
              <p className="text-muted-foreground mb-4">
                View your trade history and performance metrics.
              </p>
              <TradingAnalyticsDashboard />
            </TabsContent>
            
            <TabsContent value="performance">
              <p className="text-muted-foreground mb-4">
                Analyze your portfolio performance and strategy effectiveness.
              </p>
              <div className="h-64 flex items-center justify-center border border-dashed rounded-md">
                <span className="text-muted-foreground">Strategy performance charts will appear here</span>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTabContent;
