
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Shield,
  TrendingUp,
  Wallet,
  Bot,
  Save,
  InfoIcon,
  AlertCircle,
  Zap
} from "lucide-react";
import { 
  secureInitialInvestment, 
  TradingPosition,
  loadTradingPositions,
  saveTradingPositions
} from "@/utils/tradingUtils";

interface TradingStrategyProps {
  onSettingsChange?: (settings: TradingSettings) => void;
}

interface TradingSettings {
  enabled: boolean;
  smartMoneyTracking: boolean;
  whaleActivityMonitoring: boolean;
  walletTracking: boolean;
  qualityTokenTrading: boolean;
  takeProfit: number;
  stopLoss: number;
  secureInitial: boolean;
  secureInitialThreshold: number;
}

const TradingStrategy: React.FC<TradingStrategyProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<TradingSettings>({
    enabled: false,
    smartMoneyTracking: true,
    whaleActivityMonitoring: true,
    walletTracking: false,
    qualityTokenTrading: true,
    takeProfit: 30,
    stopLoss: 10,
    secureInitial: true,
    secureInitialThreshold: 100 // Default to 100% profit (2X) for securing initial
  });
  
  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('trading_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        // Ensure secureInitialThreshold is set to 100 (2X) for auto-secure
        parsedSettings.secureInitial = true;
        parsedSettings.secureInitialThreshold = 100;
        setSettings(parsedSettings);
      } catch (error) {
        console.error("Error loading saved trading settings:", error);
      }
    }
  }, []);
  
  const handleToggle = (key: keyof TradingSettings) => {
    // Don't allow disabling secureInitial as we want to always secure at 2X
    if (key === 'secureInitial') {
      toast(
        "Auto-Securing Enabled",
        { description: "Initial investment is always secured at 2X (100% profit) automatically" }
      );
      return;
    }
    
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };
  
  const handleSliderChange = (key: keyof TradingSettings, value: number[]) => {
    // Don't allow changing secureInitialThreshold as we want to fix it at 100% (2X)
    if (key === 'secureInitialThreshold') {
      return;
    }
    
    const newSettings = {
      ...settings,
      [key]: value[0]
    };
    
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };
  
  const handleSaveSettings = () => {
    // Ensure secureInitial is always true and threshold is 100% (2X)
    const finalSettings = {
      ...settings,
      secureInitial: true,
      secureInitialThreshold: 100
    };
    
    localStorage.setItem('trading_settings', JSON.stringify(finalSettings));
    
    toast(
      "Settings Saved",
      { description: "Your trading settings have been saved successfully" }
    );
    
    // Apply secure initial settings to any existing positions
    applySecureInitialToPositions();
  };
  
  // Apply secure initial settings to existing positions
  const applySecureInitialToPositions = () => {
    const positions = loadTradingPositions();
    
    if (positions.length === 0) {
      return;
    }
    
    let updated = false;
    const updatedPositions = positions.map(position => {
      if (position.status === 'active' && !position.securedInitial && position.currentPrice > position.entryPrice) {
        updated = true;
        return secureInitialInvestment(position, position.currentPrice);
      }
      return position;
    });
    
    if (updated) {
      saveTradingPositions(updatedPositions);
      toast(
        "Positions Updated",
        { description: "Secure initial settings applied to eligible positions" }
      );
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Trading Strategy
          </CardTitle>
          <Switch
            checked={settings.enabled}
            onCheckedChange={() => handleToggle('enabled')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Detection Sources</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-400" />
                  <Label htmlFor="smartMoneyToggle">Smart Money Tracking</Label>
                </div>
                <Switch
                  id="smartMoneyToggle"
                  checked={settings.smartMoneyTracking}
                  onCheckedChange={() => handleToggle('smartMoneyTracking')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-400" />
                  <Label htmlFor="whaleActivityToggle">Whale Activity Monitoring</Label>
                </div>
                <Switch
                  id="whaleActivityToggle"
                  checked={settings.whaleActivityMonitoring}
                  onCheckedChange={() => handleToggle('whaleActivityMonitoring')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-green-400" />
                  <Label htmlFor="walletTrackingToggle">Wallet Action Mimicking</Label>
                </div>
                <Switch
                  id="walletTrackingToggle"
                  checked={settings.walletTracking}
                  onCheckedChange={() => handleToggle('walletTracking')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <Label htmlFor="tokenQualityToggle">Quality Token Trading</Label>
                </div>
                <Switch
                  id="tokenQualityToggle"
                  checked={settings.qualityTokenTrading}
                  onCheckedChange={() => handleToggle('qualityTokenTrading')}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-medium mb-3">Trading Model Settings</h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="takeProfit">Take Profit: {settings.takeProfit}%</Label>
                </div>
                <Slider
                  id="takeProfit"
                  min={10}
                  max={100}
                  step={5}
                  value={[settings.takeProfit]}
                  onValueChange={(value) => handleSliderChange('takeProfit', value)}
                  className="mb-2"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <Label htmlFor="stopLoss">Stop Loss: {settings.stopLoss}%</Label>
                </div>
                <Slider
                  id="stopLoss"
                  min={5}
                  max={30}
                  step={1}
                  value={[settings.stopLoss]}
                  onValueChange={(value) => handleSliderChange('stopLoss', value)}
                  className="mb-2"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <Label htmlFor="secureInitialToggle">Secure Initial Investment</Label>
                </div>
                <Switch
                  id="secureInitialToggle"
                  checked={true}
                  disabled={true}
                />
              </div>
              
              <div className="space-y-2 pl-6 border-l-2 border-green-500/20">
                <div className="flex items-center gap-2">
                  <InfoIcon className="h-4 w-4 text-blue-400" />
                  <p className="text-sm font-medium">Auto-securing at 2X (100% profit)</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-md border border-green-500/20">
                  <p className="text-xs text-gray-300">
                    Initial investment is automatically secured at 2X (100% profit), followed by additional scale-outs at 3X, 5X, and 10X to maximize returns while minimizing risk.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-white/10">
            <h3 className="text-sm font-medium mb-3">Scale-Out Strategy</h3>
            <div className="bg-blue-500/10 p-3 rounded-md border border-blue-500/20 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs">Secure 50% at 2X (100% profit)</span>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 text-xs">
                  Default
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs">Scale out 25% at 3X (200% profit)</span>
                </div>
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 text-xs">
                  Active
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs">Scale out 50% at 5X (400% profit)</span>
                </div>
                <Badge variant="outline" className="bg-purple-500/20 text-purple-400 text-xs">
                  Active
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-pink-500 rounded-full"></div>
                  <span className="text-xs">Scale out 75% at 10X (900% profit)</span>
                </div>
                <Badge variant="outline" className="bg-pink-500/20 text-pink-400 text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveSettings}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Strategy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingStrategy;
