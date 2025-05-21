import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import StrategyConfig from "@/components/StrategyConfig";
import SystemStatus from "@/components/SystemStatus";
import MarketChart from "@/components/MarketChart";

/**
 * DashboardTabContent component displays the main dashboard tab content
 * with performance metrics, system status, and strategy configuration
 */
const DashboardTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Overview Dashboard</h3>
          <p className="text-muted-foreground mb-4">
            Monitor your system performance and key metrics at a glance.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PerformanceMetrics />
            <SystemStatus 
              latency={5} 
              systemActive={true} 
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Metrics</h3>
            <MarketChart symbol="SOL/USD" chain="solana" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Dashboard Strategies</h3>
            <div className="space-y-4">
              <StrategyConfig 
                title="Overview Data" 
                description="Configure what data appears on your dashboard"
                defaultEnabled={true}
                onSave={() => {}}
              />
              <StrategyConfig 
                title="Alert Display" 
                description="Configure how alerts are displayed"
                defaultEnabled={true}
                onSave={() => {}}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTabContent;
