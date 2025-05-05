
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Activity, Eye, Settings, Database, Server } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

interface FilterSettings {
  minLiquidity: number;
  minHolders: number;
  minVolume: number;
  maxRiskScore: number;
  minAgeHours: number;
}

interface BotSettings {
  isActive: boolean;
  checkInterval: number;
  notificationEnabled: boolean;
  telegramEnabled: boolean;
  filterSettings: FilterSettings;
  apiKeyConfigured: {
    helius: boolean;
    birdeye: boolean;
    jupiter: boolean;
  };
  monitoringActive: {
    newTokens: boolean;
    smartMoney: boolean;
    trendingTokens: boolean;
    webhooks: boolean;
  };
}

const DEFAULT_SETTINGS: BotSettings = {
  isActive: false,
  checkInterval: 30,
  notificationEnabled: true,
  telegramEnabled: false,
  filterSettings: {
    minLiquidity: 10000,
    minHolders: 50,
    minVolume: 5000,
    maxRiskScore: 50,
    minAgeHours: 0
  },
  apiKeyConfigured: {
    helius: true,
    birdeye: false,
    jupiter: true
  },
  monitoringActive: {
    newTokens: true,
    smartMoney: true,
    trendingTokens: true,
    webhooks: false
  }
};

const TokenDetectionBotControl: React.FC = () => {
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState('general');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  const handleToggleBot = () => {
    const newState = !settings.isActive;
    setSettings({
      ...settings,
      isActive: newState
    });
    
    toast(newState ? "Token detection bot activated" : "Token detection bot deactivated");
  };
  
  const handleUpdateFilterSettings = (key: keyof FilterSettings, value: number) => {
    setSettings({
      ...settings,
      filterSettings: {
        ...settings.filterSettings,
        [key]: value
      }
    });
  };
  
  const handleToggleMonitoring = (key: keyof typeof settings.monitoringActive) => {
    setSettings({
      ...settings,
      monitoringActive: {
        ...settings.monitoringActive,
        [key]: !settings.monitoringActive[key]
      }
    });
    
    toast(`${key} monitoring ${settings.monitoringActive[key] ? 'disabled' : 'enabled'}`);
  };
  
  const saveApiKey = () => {
    if (!apiKey) {
      toast.error("Please enter an API key");
      return;
    }
    
    toast.success("API key saved successfully");
    setApiKey("");
    setShowApiConfig(false);
    
    // Simulate configuring the API
    setSettings({
      ...settings,
      apiKeyConfigured: {
        ...settings.apiKeyConfigured,
        birdeye: true
      }
    });
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" />
            DRAKO AI Token Detection Bot
          </div>
          <Badge className={settings.isActive ? "bg-green-600" : "bg-red-600"}>
            {settings.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Bot Status</h3>
              <p className="text-xs text-gray-400">Enable or disable the token detection bot</p>
            </div>
            <Switch 
              checked={settings.isActive} 
              onCheckedChange={handleToggleBot}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-black/20 border-white/10 border">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="checkInterval">Check Interval (seconds)</Label>
                <Slider
                  id="checkInterval"
                  value={[settings.checkInterval]}
                  min={5}
                  max={120}
                  step={5}
                  onValueChange={(value) => {
                    setSettings({
                      ...settings,
                      checkInterval: value[0]
                    });
                  }}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>5s</span>
                  <span>30s</span>
                  <span>60s</span>
                  <span>120s</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Current: {settings.checkInterval} seconds</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications</Label>
                  <p className="text-xs text-gray-400">Enable browser notifications</p>
                </div>
                <Switch 
                  checked={settings.notificationEnabled} 
                  onCheckedChange={(checked) => {
                    setSettings({
                      ...settings,
                      notificationEnabled: checked
                    });
                  }}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Telegram Integration</Label>
                  <p className="text-xs text-gray-400">Send alerts to Telegram</p>
                </div>
                <Switch 
                  checked={settings.telegramEnabled} 
                  onCheckedChange={(checked) => {
                    setSettings({
                      ...settings,
                      telegramEnabled: checked
                    });
                    if (checked) {
                      toast("Telegram integration enabled");
                    }
                  }}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="filters" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="minLiquidity">Minimum Liquidity ($)</Label>
                <Slider
                  id="minLiquidity"
                  value={[settings.filterSettings.minLiquidity]}
                  min={1000}
                  max={100000}
                  step={1000}
                  onValueChange={(value) => handleUpdateFilterSettings('minLiquidity', value[0])}
                  className="mt-2"
                />
                <p className="text-xs text-gray-400 mt-1">Current: ${settings.filterSettings.minLiquidity.toLocaleString()}</p>
              </div>
              
              <div>
                <Label htmlFor="minHolders">Minimum Holders</Label>
                <Slider
                  id="minHolders"
                  value={[settings.filterSettings.minHolders]}
                  min={10}
                  max={500}
                  step={10}
                  onValueChange={(value) => handleUpdateFilterSettings('minHolders', value[0])}
                  className="mt-2"
                />
                <p className="text-xs text-gray-400 mt-1">Current: {settings.filterSettings.minHolders} holders</p>
              </div>
              
              <div>
                <Label htmlFor="maxRiskScore">Maximum Risk Score</Label>
                <Slider
                  id="maxRiskScore"
                  value={[settings.filterSettings.maxRiskScore]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => handleUpdateFilterSettings('maxRiskScore', value[0])}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-400">Low Risk</span>
                  <span className="text-yellow-400">Medium</span>
                  <span className="text-red-400">High Risk</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Current: {settings.filterSettings.maxRiskScore}/100</p>
              </div>
            </TabsContent>
            
            <TabsContent value="monitoring" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Token Monitoring</Label>
                    <p className="text-xs text-gray-400">Detect newly launched tokens</p>
                  </div>
                  <Switch 
                    checked={settings.monitoringActive.newTokens} 
                    onCheckedChange={() => handleToggleMonitoring('newTokens')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Smart Money Tracking</Label>
                    <p className="text-xs text-gray-400">Monitor whale wallet activity</p>
                  </div>
                  <Switch 
                    checked={settings.monitoringActive.smartMoney} 
                    onCheckedChange={() => handleToggleMonitoring('smartMoney')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trending Token Detection</Label>
                    <p className="text-xs text-gray-400">Track trending tokens across DEXes</p>
                  </div>
                  <Switch 
                    checked={settings.monitoringActive.trendingTokens} 
                    onCheckedChange={() => handleToggleMonitoring('trendingTokens')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Webhook Monitoring</Label>
                    <p className="text-xs text-gray-400">Use Helius webhooks for real-time data</p>
                  </div>
                  <Switch 
                    checked={settings.monitoringActive.webhooks} 
                    onCheckedChange={() => handleToggleMonitoring('webhooks')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4 mt-4">
              <div className="bg-black/20 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    <span>Helius API</span>
                  </div>
                  <Badge className={settings.apiKeyConfigured.helius ? "bg-green-600" : "bg-red-600"}>
                    {settings.apiKeyConfigured.helius ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-400" />
                    <span>BirdEye API</span>
                  </div>
                  <Badge className={settings.apiKeyConfigured.birdeye ? "bg-green-600" : "bg-red-600"}>
                    {settings.apiKeyConfigured.birdeye ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-400" />
                    <span>Jupiter API</span>
                  </div>
                  <Badge className={settings.apiKeyConfigured.jupiter ? "bg-green-600" : "bg-red-600"}>
                    {settings.apiKeyConfigured.jupiter ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
              </div>
              
              {!settings.apiKeyConfigured.birdeye && (
                <div className="flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowApiConfig(true)}
                    className="bg-black/20 border-white/10"
                  >
                    Configure BirdEye API
                  </Button>
                </div>
              )}
              
              {showApiConfig && (
                <div className="bg-black/30 p-4 rounded-lg space-y-4 mt-4">
                  <h3 className="font-medium">Configure BirdEye API</h3>
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="text"
                      placeholder="Enter your BirdEye API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-black/20 border-white/10 mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowApiConfig(false);
                        setApiKey("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={saveApiKey}>
                      Save API Key
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {settings.isActive ? (
            <div className="bg-green-900/20 border border-green-500/20 rounded-md p-3 mt-4">
              <p className="text-xs text-green-300 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Bot is active and monitoring for new tokens with your current settings
              </p>
            </div>
          ) : (
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-md p-3 mt-4">
              <p className="text-xs text-yellow-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Bot is currently inactive. Enable it to start monitoring for tokens.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenDetectionBotControl;
