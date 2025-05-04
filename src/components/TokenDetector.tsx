
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Bell, 
  Shield, 
  Zap, 
  Filter, 
  BarChart2,
  Save
} from "lucide-react";

interface DetectionSettings {
  enabled: boolean;
  minimumLiquidity: number;
  minimumVolume: number;
  minimumHolders: number;
  maximumRisk: number;
  alertsEnabled: boolean;
  blacklistFarming: boolean;
  trackSmartMoney: boolean;
}

const TokenDetector = () => {
  const [settings, setSettings] = useState<DetectionSettings>({
    enabled: true,
    minimumLiquidity: 10000, // $10k minimum liquidity
    minimumVolume: 5000, // $5k minimum 24h volume
    minimumHolders: 50,
    maximumRisk: 70, // 0-100 scale
    alertsEnabled: true,
    blacklistFarming: true,
    trackSmartMoney: true
  });
  
  const [wallets, setWallets] = useState<string[]>([
    "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT", 
    "HxFLKUAmAMLz1jtT3hbvCMELwH5H9tpM2QugP8sKyfhm"
  ]);
  
  const { toast } = useToast();
  
  const handleSettingsChange = (setting: keyof DetectionSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const handleSaveSettings = () => {
    // In a real implementation, save to backend/localStorage
    localStorage.setItem('token_detector_settings', JSON.stringify(settings));
    localStorage.setItem('token_detector_wallets', JSON.stringify(wallets));
    
    toast({
      title: "Detection settings saved",
      description: "Your token detection parameters have been updated",
    });
  };
  
  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('token_detector_settings');
    const savedWallets = localStorage.getItem('token_detector_wallets');
    
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved detector settings', e);
      }
    }
    
    if (savedWallets) {
      try {
        setWallets(JSON.parse(savedWallets));
      } catch (e) {
        console.error('Failed to parse saved wallets', e);
      }
    }
  }, []);
  
  return (
    <Card className="trading-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-trading-highlight" />
              Drako AI Token Detector
            </CardTitle>
            <CardDescription>
              Configure token detection parameters and filters
            </CardDescription>
          </div>
          <Switch 
            checked={settings.enabled}
            onCheckedChange={(checked) => handleSettingsChange('enabled', checked)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-gray-400">Minimum Liquidity</Label>
              <span className="font-medium">${settings.minimumLiquidity.toLocaleString()}</span>
            </div>
            <Slider 
              value={[settings.minimumLiquidity]} 
              min={1000}
              max={100000}
              step={1000}
              onValueChange={(value) => handleSettingsChange('minimumLiquidity', value[0])}
              disabled={!settings.enabled}
              className="[&>span.SliderRange]:bg-trading-highlight"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>$1k</span>
              <span>$100k</span>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-gray-400">Minimum 24h Volume</Label>
              <span className="font-medium">${settings.minimumVolume.toLocaleString()}</span>
            </div>
            <Slider 
              value={[settings.minimumVolume]} 
              min={1000}
              max={50000}
              step={1000}
              onValueChange={(value) => handleSettingsChange('minimumVolume', value[0])}
              disabled={!settings.enabled}
              className="[&>span.SliderRange]:bg-trading-highlight"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-gray-400">Minimum Holders</Label>
              <span className="font-medium">{settings.minimumHolders} holders</span>
            </div>
            <Slider 
              value={[settings.minimumHolders]} 
              min={10}
              max={200}
              step={10}
              onValueChange={(value) => handleSettingsChange('minimumHolders', value[0])}
              disabled={!settings.enabled}
              className="[&>span.SliderRange]:bg-trading-highlight"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-gray-400">Maximum Risk Score</Label>
              <span className={`font-medium ${
                settings.maximumRisk <= 30 ? 'text-green-500' :
                settings.maximumRisk <= 70 ? 'text-amber-500' :
                'text-red-500'
              }`}>{settings.maximumRisk}/100</span>
            </div>
            <Slider 
              value={[settings.maximumRisk]} 
              min={10}
              max={100}
              step={5}
              onValueChange={(value) => handleSettingsChange('maximumRisk', value[0])}
              disabled={!settings.enabled}
              className="[&>span.SliderRange]:bg-trading-highlight"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span className="text-green-500">Secure</span>
              <span className="text-amber-500">Medium</span>
              <span className="text-red-500">High Risk</span>
            </div>
          </div>
          
          <Separator className="bg-white/10" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-trading-highlight" />
                <Label>Enable Alerts</Label>
              </div>
              <Switch 
                checked={settings.alertsEnabled}
                onCheckedChange={(checked) => handleSettingsChange('alertsEnabled', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-trading-highlight" />
                <Label>Blacklist Farming Tokens</Label>
              </div>
              <Switch 
                checked={settings.blacklistFarming}
                onCheckedChange={(checked) => handleSettingsChange('blacklistFarming', checked)}
                disabled={!settings.enabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-trading-highlight" />
                <Label>Track Smart Money</Label>
              </div>
              <Switch 
                checked={settings.trackSmartMoney}
                onCheckedChange={(checked) => handleSettingsChange('trackSmartMoney', checked)}
                disabled={!settings.enabled}
              />
            </div>
          </div>
          
          <Separator className="bg-white/10" />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="flex items-center gap-1">
                <BarChart2 size={16} className="text-trading-highlight" />
                Tracked Smart Wallets
              </Label>
              <Badge variant="outline" className="bg-trading-highlight/10 border-trading-highlight/30">
                {wallets.length} Active
              </Badge>
            </div>
            
            <div className="bg-black/20 rounded-md p-3 max-h-32 overflow-y-auto text-xs font-mono">
              {wallets.map((wallet, index) => (
                <div key={index} className="flex justify-between items-center py-1">
                  <span className="text-gray-300 truncate">{wallet}</span>
                  <Badge className="bg-green-600/30 text-green-200 border-none">Active</Badge>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-amber-400/10 border border-amber-400/20 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-200">
              Setting risk thresholds too low might exclude potentially profitable opportunities. 
              Drako AI uses advanced heuristics to detect suspicious tokens beyond simple metrics.
            </p>
          </div>
          
          <Button 
            onClick={handleSaveSettings} 
            className="w-full bg-trading-highlight hover:bg-trading-highlight/80"
            disabled={!settings.enabled}
          >
            <Save size={16} className="mr-2" />
            Save Detection Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenDetector;
