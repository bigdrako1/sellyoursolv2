
import { useState } from "react";
import Overview from "@/components/Overview";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import StrategyConfig from "@/components/StrategyConfig";
import SystemStatus from "@/components/SystemStatus";
import TradeAlerts from "@/components/TradeAlerts";
import MarketChart from "@/components/MarketChart";
import TransactionHistory from "@/components/TransactionHistory";
import TradePerformanceGrade from "@/components/TradePerformanceGrade";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

// Sample performance metrics for grading
const PERFORMANCE_METRICS = {
  winRate: 68.5,
  profitFactor: 1.75,
  averageReturn: 0.029,
  maxDrawdown: 18.5,
  tradeFrequency: 42,
  successRate: 78,
  sharpeRatio: 1.32
};

interface DashboardProps {
  totalProfit: number;
  activeStrategies: number;
  pendingTrades: number;
  totalTrades: number;
  systemLatency: number | null;
  systemActive: boolean;
  onStrategyChange: (strategyName: string, settings: any) => void;
}

const Dashboard = ({
  totalProfit,
  activeStrategies,
  pendingTrades,
  totalTrades,
  systemLatency,
  systemActive,
  onStrategyChange
}: DashboardProps) => {
  const { toast } = useToast();
  
  return (
    <div className="py-6 px-4">
      <div className="mb-8">
        <Overview 
          totalProfit={totalProfit} 
          activeStrategies={activeStrategies} 
          pendingTrades={pendingTrades} 
          totalTrades={totalTrades} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PerformanceMetrics />
        </div>
        
        <div className="bg-trading-darkAccent/30 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Active Strategies</h3>
            <Link to="/settings" className="p-2 rounded-full hover:bg-white/10">
              <Settings size={18} className="text-trading-highlight" />
            </Link>
          </div>
          <div className="space-y-4">
            <StrategyConfig 
              title="Front Running AI" 
              description="Detect and execute trades ahead of identified market movements"
              defaultEnabled={true}
              onSave={settings => onStrategyChange("Front Running AI", settings)}
            />
            <StrategyConfig 
              title="Market Runner Detection" 
              description="Identify early market trends and capitalize on momentum"
              defaultEnabled={true}
              onSave={settings => onStrategyChange("Market Runner Detection", settings)}
            />
            <StrategyConfig 
              title="Wallet Activity Tracker" 
              description="Track and mimic profitable wallet activities"
              onSave={settings => onStrategyChange("Wallet Activity Tracker", settings)}
            />
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <TradePerformanceGrade metrics={PERFORMANCE_METRICS} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <SystemStatus latency={systemLatency} systemActive={systemActive} />
        <TradeAlerts />
      </div>
      
      <Tabs defaultValue="solana" className="mb-8">
        <TabsList className="bg-trading-darkAccent w-full">
          <TabsTrigger value="solana" className="flex-1">
            <div className="w-3 h-3 rounded-full bg-solana mr-2"></div> Solana
          </TabsTrigger>
        </TabsList>
        <TabsContent value="solana" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MarketChart symbol="SOL/USD" chain="solana" />
            <MarketChart symbol="SRUN/SOL" chain="solana" />
          </div>
        </TabsContent>
      </Tabs>
      
      <TransactionHistory />
    </div>
  );
};

export default Dashboard;
