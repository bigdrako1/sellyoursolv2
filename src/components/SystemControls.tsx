
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Power,
  AlertCircle,
  CheckCircle2,
  Settings,
  Zap,
  Shield,
  RefreshCw,
  Loader2,
  BarChart2,
  Bot,
  Activity,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore } from "@/store/settingsStore";

export interface SystemControlsProps {
  systemActive: boolean;
  toggleSystemActive: () => void;
  showFullControls?: boolean;
}

const SystemControls = ({
  systemActive,
  toggleSystemActive,
  showFullControls = false
}: SystemControlsProps) => {
  const activeTab = useSettingsStore((state) => state.uiState.activeSystemControlTab);
  const setActiveTab = useSettingsStore((state) => state.setActiveSystemControlTab);

  const [isLoading, setIsLoading] = useState(false);
  const [riskLevel, setRiskLevel] = useState(50);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [stopLossEnabled, setStopLossEnabled] = useState(true);

  // Enhanced toggle system function
  const handleToggleSystem = async () => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Call the original toggle function
      toggleSystemActive();

      toast.success(!systemActive ? "System activated" : "System deactivated", {
        description: !systemActive
          ? "The trading system is now active and will execute trades automatically."
          : "The trading system has been deactivated. No automatic trades will be executed."
      });
    } catch (error) {
      toast.error("System toggle failed", {
        description: "There was an error toggling the system state. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simple navigation controls
  if (!showFullControls) {
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
              onClick={handleToggleSystem}
              variant="outline"
              disabled={isLoading}
              className={`gap-1 transition-all duration-300 ${
                systemActive
                  ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30"
                  : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {systemActive ? 'Deactivating...' : 'Activating...'}
                </>
              ) : systemActive ? (
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
  }

  // Full control panel
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Controls</span>
          <Badge variant="outline" className={`${systemActive ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
            {systemActive ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Control the automated trading system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg border border-white/5">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${systemActive ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
            <Power className={`h-8 w-8 ${systemActive ? 'text-green-400' : 'text-red-400'}`} />
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-medium">Trading System</h3>
            <p className="text-sm text-gray-400">
              {systemActive
                ? 'System is actively monitoring and trading'
                : 'System is currently inactive'}
            </p>
          </div>

          <Button
            variant={systemActive ? "destructive" : "default"}
            className="w-full"
            onClick={handleToggleSystem}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {systemActive ? 'Deactivating...' : 'Activating...'}
              </>
            ) : (
              <>
                {systemActive ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Deactivate System
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Activate System
                  </>
                )}
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="risk-level">Risk Level: {riskLevel}%</Label>
            </div>
            <Slider
              id="risk-level"
              min={10}
              max={90}
              step={10}
              value={[riskLevel]}
              onValueChange={(value) => setRiskLevel(value[0])}
              disabled={!systemActive}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <Label htmlFor="stop-loss">Automatic Stop Loss</Label>
            </div>
            <Switch
              id="stop-loss"
              checked={stopLossEnabled}
              onCheckedChange={setStopLossEnabled}
              disabled={!systemActive}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              <Label htmlFor="auto-rebalance">Auto Rebalance</Label>
            </div>
            <Switch
              id="auto-rebalance"
              checked={autoRebalance}
              onCheckedChange={setAutoRebalance}
              disabled={!systemActive}
            />
          </div>

          <Button
            variant="outline"
            className="w-full bg-black/20 border-white/10"
            disabled={!systemActive}
          >
            <Settings className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemControls;
