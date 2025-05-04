
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Zap, Bot, BarChart2, Activity, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface SystemControlsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemActive: boolean;
  toggleSystemActive: () => void;
}

const SystemControls = ({ 
  activeTab, 
  setActiveTab, 
  systemActive, 
  toggleSystemActive 
}: SystemControlsProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
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
        <Link to="/settings">
          <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent hover:bg-white/10 border-white/10">
            <Settings size={14} />
            <span className="hidden md:inline">Settings</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SystemControls;
