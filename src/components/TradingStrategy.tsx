
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  TrendingUp,
  Wallet,
  Bot,
  Save
} from "lucide-react";

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
    secureInitialThreshold: 20
  });
  
  const { toast } = useToast();
  
  const handleToggle = (key: keyof TradingSettings) => {
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
    localStorage.setItem('trading_settings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your trading settings have been saved successfully",
    });
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trading Strategy</CardTitle>
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
            <h3 className="text-sm font-medium mb-3">Strategy Settings</h3>
            
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
                  checked={settings.secureInitial}
                  onCheckedChange={() => handleToggle('secureInitial')}
                />
              </div>
              
              {settings.secureInitial && (
                <div className="space-y-2 pl-6 border-l-2 border-green-500/20">
                  <Label htmlFor="secureThreshold">
                    Secure at Profit %: {settings.secureInitialThreshold}%
                  </Label>
                  <Slider
                    id="secureThreshold"
                    min={10}
                    max={100}
                    step={5}
                    value={[settings.secureInitialThreshold]}
                    onValueChange={(value) => handleSliderChange('secureInitialThreshold', value)}
                  />
                  <p className="text-xs text-gray-400">
                    System will automatically secure your initial investment when profit reaches {settings.secureInitialThreshold}%
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button 
              onClick={handleSaveSettings}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingStrategy;
