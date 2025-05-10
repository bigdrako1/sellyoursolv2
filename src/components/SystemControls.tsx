
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, Zap, Bot, Activity, AlertTriangle } from "lucide-react";
import { useSettingsStore } from "@/store/settingsStore";

export interface SystemControlsProps {
  systemActive: boolean;
  toggleSystemActive: () => void;
}

const SystemControls = ({ 
  systemActive, 
  toggleSystemActive 
}: SystemControlsProps) => {
  const activeTab = useSettingsStore((state) => state.uiState.activeSystemControlTab);
  const setActiveTab = useSettingsStore((state) => state.setActiveSystemControlTab);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-trading-darkAccent">
            <TabsTrigger value="dashboard" className="gap-1">
              <BarChart2 size={14} /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="trading" className="gap-1">
              <Zap size={14} /> Auto Trading
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-1">
              <Bot size={14} /> Wallet Tracking
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <Activity size={14} /> Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">          
          <Button 
            onClick={toggleSystemActive}
            variant="outline"
            className={`gap-1 transition-all duration-300 ${
              systemActive 
                ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30" 
                : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
            }`}
          >
            {systemActive ? (
              <>
                <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                System Active
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                System Paused
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SystemControls;
