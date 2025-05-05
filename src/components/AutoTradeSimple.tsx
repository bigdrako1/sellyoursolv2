import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  Shield,
  Bot,
  AlertCircle,
  Settings,
  Save,
} from "lucide-react";

// Trading system states
const AUTO_TRADE_CONFIG_KEY = "auto_trade_config";

interface TradingConfig {
  enabled: boolean;
  tradeAmount: number;
  maxPositions: number;
  riskLevel: number;
  secureInitial: boolean;
  secureInitialThreshold: number;
  stopLoss: number;
  takeProfit: number;
  trailingStopLoss: boolean;
  trailingStopLossDistance: number;
  features: {
    smartMoneyTracking: boolean;
    whaleActivityMonitoring: boolean;
    walletTracking: boolean;
    qualityTokenTrading: boolean;
  };
}

// Define a proper interface for the wallets we're tracking
interface TrackedWallet {
  address: string;
  label?: string;
}

const AutoTradeSimple: React.FC = () => {
  const [config, setConfig] = useState<TradingConfig>({
    enabled: false,
    tradeAmount: 0.1,
    maxPositions: 3,
    riskLevel: 50,
    secureInitial: true,
    secureInitialThreshold: 30,
    stopLoss: 10,
    takeProfit: 30,
    trailingStopLoss: true,
    trailingStopLossDistance: 10,
    features: {
      smartMoneyTracking: true,
      whaleActivityMonitoring: true,
      walletTracking: false,
      qualityTokenTrading: true,
    },
  });

  const [trackedWallets, setTrackedWallets] = useState<string[]>([
    "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
  ]);
  const [newWallet, setNewWallet] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // Load saved configuration
  useEffect(() => {
    const savedConfig = localStorage.getItem(AUTO_TRADE_CONFIG_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error("Error loading saved trading configuration:", error);
      }
    }

    const savedWallets = localStorage.getItem("tracked_wallets");
    if (savedWallets) {
      try {
        setTrackedWallets(JSON.parse(savedWallets));
      } catch (error) {
        console.error("Error loading tracked wallets:", error);
      }
    }
  }, []);

  const handleAddWallet = () => {
    if (newWallet && newWallet.length >= 32 && !trackedWallets.includes(newWallet)) {
      const updatedWallets = [...trackedWallets, newWallet];
      setTrackedWallets(updatedWallets);
      setNewWallet("");
      localStorage.setItem("tracked_wallets", JSON.stringify(updatedWallets));
      
      toast("Wallet Added", {
        description: "New wallet has been added to tracking list."
      });
    } else {
      toast("Invalid Wallet", {
        description: "Please enter a valid Solana wallet address that isn't already being tracked."
      });
    }
  };

  const handleRemoveWallet = (wallet: string) => {
    const updatedWallets = trackedWallets.filter(w => w !== wallet);
    setTrackedWallets(updatedWallets);
    localStorage.setItem("tracked_wallets", JSON.stringify(updatedWallets));
    
    toast("Wallet Removed", {
      description: "Wallet has been removed from tracking list."
    });
  };

  const handleSaveConfig = () => {
    localStorage.setItem(AUTO_TRADE_CONFIG_KEY, JSON.stringify(config));
    
    toast("Configuration Saved", {
      description: "Your trading settings have been saved successfully."
    });
  };

  const handleToggleFeature = (feature: keyof TradingConfig['features']) => {
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: !config.features[feature]
      }
    });
  };

  const handleToggleEnabled = () => {
    const newEnabledState = !config.enabled;
    setConfig({
      ...config,
      enabled: newEnabledState
    });
    
    toast(newEnabledState ? "Auto Trading Enabled" : "Auto Trading Disabled", {
      description: newEnabledState 
        ? "The system will now automatically trade based on your settings." 
        : "Auto trading has been turned off."
    });
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Automated Trading System
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className={config.enabled ? "bg-green-600" : "bg-gray-600"}>
              {config.enabled ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="strategy">Trading Strategy</TabsTrigger>
            <TabsTrigger value="wallets">Wallet Tracking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tradeAmount">Trade Amount (SOL)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="tradeAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={config.tradeAmount}
                      onChange={(e) => setConfig({
                        ...config,
                        tradeAmount: parseFloat(e.target.value) || 0.01
                      })}
                      className="bg-black/20 border-white/10"
                    />
                    <span className="text-xs text-gray-400">SOL</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="maxPositions">Max Concurrent Positions</Label>
                  <Input
                    id="maxPositions"
                    type="number"
                    min="1"
                    max="10"
                    value={config.maxPositions}
                    onChange={(e) => setConfig({
                      ...config,
                      maxPositions: parseInt(e.target.value) || 1
                    })}
                    className="mt-1 bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskLevel">Risk Level: {config.riskLevel}%</Label>
                <Slider
                  id="riskLevel"
                  min={10}
                  max={90}
                  step={5}
                  value={[config.riskLevel]}
                  onValueChange={(value) => setConfig({
                    ...config,
                    riskLevel: value[0]
                  })}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 rounded-md p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs">
                  Higher risk levels enable more aggressive trading strategies with potentially higher returns but also higher risk of losses. Adjust based on your risk tolerance.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium mb-2">Trading Features</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  <Label htmlFor="smartMoneyToggle">Smart Money Tracking</Label>
                </div>
                <Switch 
                  id="smartMoneyToggle"
                  checked={config.features.smartMoneyTracking}
                  onCheckedChange={() => handleToggleFeature('smartMoneyTracking')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-purple-400" />
                  <Label htmlFor="whaleMonitoringToggle">Whale Activity Monitoring</Label>
                </div>
                <Switch 
                  id="whaleMonitoringToggle"
                  checked={config.features.whaleActivityMonitoring}
                  onCheckedChange={() => handleToggleFeature('whaleActivityMonitoring')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-green-400" />
                  <Label htmlFor="walletTrackingToggle">Wallet Action Mimicking</Label>
                </div>
                <Switch 
                  id="walletTrackingToggle"
                  checked={config.features.walletTracking}
                  onCheckedChange={() => handleToggleFeature('walletTracking')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-amber-400" />
                  <Label htmlFor="tokenQualityToggle">Quality Token Trading</Label>
                </div>
                <Switch 
                  id="tokenQualityToggle"
                  checked={config.features.qualityTokenTrading}
                  onCheckedChange={() => handleToggleFeature('qualityTokenTrading')}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="strategy">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-400" />
                  <Label htmlFor="secureInitialToggle">Secure Initial Investment</Label>
                </div>
                <Switch 
                  id="secureInitialToggle"
                  checked={config.secureInitial}
                  onCheckedChange={(checked) => setConfig({...config, secureInitial: checked})}
                />
              </div>
              
              {config.secureInitial && (
                <div className="space-y-2 pl-6 border-l-2 border-green-500/20">
                  <Label htmlFor="secureThreshold">
                    Secure at Profit %: {config.secureInitialThreshold}%
                  </Label>
                  <Slider
                    id="secureThreshold"
                    min={10}
                    max={100}
                    step={5}
                    value={[config.secureInitialThreshold]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      secureInitialThreshold: value[0]
                    })}
                  />
                  <p className="text-xs text-gray-400">
                    When profit reaches {config.secureInitialThreshold}%, the system will secure your initial investment.
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss: {config.stopLoss}%</Label>
                <Slider
                  id="stopLoss"
                  min={5}
                  max={30}
                  step={1}
                  value={[config.stopLoss]}
                  onValueChange={(value) => setConfig({
                    ...config,
                    stopLoss: value[0]
                  })}
                />
                <p className="text-xs text-gray-400">
                  Exit position if price falls by {config.stopLoss}% from entry.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit: {config.takeProfit}%</Label>
                <Slider
                  id="takeProfit"
                  min={10}
                  max={100}
                  step={5}
                  value={[config.takeProfit]}
                  onValueChange={(value) => setConfig({
                    ...config,
                    takeProfit: value[0]
                  })}
                />
                <p className="text-xs text-gray-400">
                  Exit position when profit reaches {config.takeProfit}%.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-400" />
                  <Label htmlFor="trailingStopLossToggle">Trailing Stop Loss</Label>
                </div>
                <Switch 
                  id="trailingStopLossToggle"
                  checked={config.trailingStopLoss}
                  onCheckedChange={(checked) => setConfig({...config, trailingStopLoss: checked})}
                />
              </div>
              
              {config.trailingStopLoss && (
                <div className="space-y-2 pl-6 border-l-2 border-blue-500/20">
                  <Label htmlFor="trailingDistance">
                    Trailing Distance: {config.trailingStopLossDistance}%
                  </Label>
                  <Slider
                    id="trailingDistance"
                    min={5}
                    max={25}
                    step={1}
                    value={[config.trailingStopLossDistance]}
                    onValueChange={(value) => setConfig({
                      ...config,
                      trailingStopLossDistance: value[0]
                    })}
                  />
                  <p className="text-xs text-gray-400">
                    Stop loss will follow price at {config.trailingStopLossDistance}% distance.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="wallets">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newWallet">Add Wallet to Track</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newWallet"
                    placeholder="Enter wallet address"
                    value={newWallet}
                    onChange={(e) => setNewWallet(e.target.value)}
                    className="bg-black/20 border-white/10 flex-1"
                  />
                  <Button onClick={handleAddWallet}>Add</Button>
                </div>
                <p className="text-xs text-gray-400">
                  Add wallets to track and mimic transactions. Works when Wallet Action Mimicking is enabled.
                </p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-2 max-h-60 overflow-y-auto">
                {trackedWallets.length > 0 ? (
                  <div className="space-y-2">
                    {trackedWallets.map((wallet) => (
                      <div key={wallet} className="flex items-center justify-between p-2 bg-black/30 rounded">
                        <div className="text-xs font-mono truncate w-3/4">{wallet}</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveWallet(wallet)}
                          className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No wallets being tracked. Add a wallet to begin tracking.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={handleSaveConfig}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoTradeSimple;
