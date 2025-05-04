
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Cpu, 
  Upload, 
  Activity, 
  AlertCircle, 
  Zap,
  Bot,
  ArrowUpRight,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/config/appDefinition";

const AutoTradeConfig = () => {
  const [activeTab, setActiveTab] = useState("frontrun");
  const [settings, setSettings] = useState({
    frontRunning: {
      enabled: true,
      sensitivity: 80,
      maxGasPrice: 50,
      slippageTolerance: 2,
      autoAdjustGas: true,
      targetChains: ["solana"]
    },
    marketRunner: {
      enabled: true,
      detectionThreshold: 70,
      reactionSpeed: 90,
      maxExposure: 20,
      timeToLive: 30,
      stopLoss: 10,
      targetChains: ["solana"]
    },
    walletTracker: {
      enabled: false,
      minimumBalance: 100000,
      copyThreshold: 60,
      delaySeconds: 5,
      maxWallets: 10,
      maxCopyAmount: 30,
      targetChains: ["solana"]
    }
  });
  const { toast } = useToast();

  const toggleSetting = (feature: string, setting: string) => {
    setSettings({
      ...settings,
      [feature]: {
        ...settings[feature as keyof typeof settings],
        [setting]: !settings[feature as keyof typeof settings][setting as keyof typeof settings[keyof typeof settings]]
      }
    });
  };

  const updateSliderValue = (feature: string, setting: string, value: number[]) => {
    setSettings({
      ...settings,
      [feature]: {
        ...settings[feature as keyof typeof settings],
        [setting]: value[0]
      }
    });
  };

  const toggleChain = (feature: string, chain: string) => {
    const currentChains = settings[feature as keyof typeof settings].targetChains as string[];
    const updatedChains = currentChains.includes(chain)
      ? currentChains.filter(c => c !== chain)
      : [...currentChains, chain];
    
    setSettings({
      ...settings,
      [feature]: {
        ...settings[feature as keyof typeof settings],
        targetChains: updatedChains
      }
    });
  };

  const handleSaveAndApply = () => {
    // Save settings to localStorage for persistence
    localStorage.setItem('trading_settings', JSON.stringify(settings));
    
    toast({
      title: "Settings Applied",
      description: "Your trading configuration has been saved and applied.",
    });
  };

  const handleImport = () => {
    try {
      // Open a file picker dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const importedSettings = JSON.parse(event.target.result);
            setSettings(importedSettings);
            
            toast({
              title: "Settings Imported",
              description: "Trading configuration has been imported successfully.",
            });
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Invalid configuration file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Could not import settings file.",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "frontrun":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-trading-highlight" />
                <span className="font-medium">Front-Running Bot</span>
              </div>
              <Switch 
                checked={settings.frontRunning.enabled}
                onCheckedChange={() => toggleSetting('frontRunning', 'enabled')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Detection Sensitivity</span>
                    <span className="text-sm font-medium">{settings.frontRunning.sensitivity}%</span>
                  </div>
                  <Slider 
                    value={[settings.frontRunning.sensitivity]}
                    min={40}
                    max={100}
                    step={1}
                    onValueChange={(value) => updateSliderValue('frontRunning', 'sensitivity', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Max Gas Price (Gwei)</span>
                    <span className="text-sm font-medium">{settings.frontRunning.maxGasPrice}</span>
                  </div>
                  <Slider 
                    value={[settings.frontRunning.maxGasPrice]}
                    min={10}
                    max={200}
                    step={5}
                    onValueChange={(value) => updateSliderValue('frontRunning', 'maxGasPrice', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Slippage Tolerance (%)</span>
                    <span className="text-sm font-medium">{settings.frontRunning.slippageTolerance}%</span>
                  </div>
                  <Slider 
                    value={[settings.frontRunning.slippageTolerance]}
                    min={0.5}
                    max={10}
                    step={0.5}
                    onValueChange={(value) => updateSliderValue('frontRunning', 'slippageTolerance', value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Auto-adjust Gas Price</span>
                  <Switch 
                    checked={settings.frontRunning.autoAdjustGas}
                    onCheckedChange={() => toggleSetting('frontRunning', 'autoAdjustGas')}
                  />
                </div>

                <div>
                  <p className="text-sm mb-2">Target Chains</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        settings.frontRunning.targetChains.includes("solana") 
                          ? "bg-solana/20 border-solana/50 text-white" 
                          : "bg-transparent"
                      )}
                      onClick={() => toggleChain('frontRunning', 'solana')}
                    >
                      <div className="w-2 h-2 rounded-full bg-solana"></div>
                      Solana
                    </Button>
                  </div>
                </div>

                <div className="bg-trading-highlight/10 p-3 rounded-md border border-trading-highlight/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-trading-highlight mt-0.5" />
                    <p className="text-xs text-gray-400">
                      Front-running identifies pending transactions in the mempool and executes trades before they're processed, capturing value from predictable price movements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "market":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={16} className="text-trading-highlight" />
                <span className="font-medium">Market Runner Detector</span>
              </div>
              <Switch 
                checked={settings.marketRunner.enabled}
                onCheckedChange={() => toggleSetting('marketRunner', 'enabled')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Detection Threshold</span>
                    <span className="text-sm font-medium">{settings.marketRunner.detectionThreshold}%</span>
                  </div>
                  <Slider 
                    value={[settings.marketRunner.detectionThreshold]}
                    min={30}
                    max={95}
                    step={5}
                    onValueChange={(value) => updateSliderValue('marketRunner', 'detectionThreshold', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Reaction Speed</span>
                    <span className="text-sm font-medium">{settings.marketRunner.reactionSpeed}%</span>
                  </div>
                  <Slider 
                    value={[settings.marketRunner.reactionSpeed]}
                    min={50}
                    max={99}
                    step={1}
                    onValueChange={(value) => updateSliderValue('marketRunner', 'reactionSpeed', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Max Exposure (%)</span>
                    <span className="text-sm font-medium">{settings.marketRunner.maxExposure}%</span>
                  </div>
                  <Slider 
                    value={[settings.marketRunner.maxExposure]}
                    min={5}
                    max={50}
                    step={5}
                    onValueChange={(value) => updateSliderValue('marketRunner', 'maxExposure', value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Time-to-Live (minutes)</span>
                    <span className="text-sm font-medium">{settings.marketRunner.timeToLive}</span>
                  </div>
                  <Slider 
                    value={[settings.marketRunner.timeToLive]}
                    min={5}
                    max={120}
                    step={5}
                    onValueChange={(value) => updateSliderValue('marketRunner', 'timeToLive', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Stop-Loss (%)</span>
                    <span className="text-sm font-medium">{settings.marketRunner.stopLoss}%</span>
                  </div>
                  <Slider 
                    value={[settings.marketRunner.stopLoss]}
                    min={5}
                    max={50}
                    step={5}
                    onValueChange={(value) => updateSliderValue('marketRunner', 'stopLoss', value)}
                  />
                </div>

                <div>
                  <p className="text-sm mb-2">Target Chains</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        settings.marketRunner.targetChains.includes("solana") 
                          ? "bg-solana/20 border-solana/50 text-white" 
                          : "bg-transparent"
                      )}
                      onClick={() => toggleChain('marketRunner', 'solana')}
                    >
                      <div className="w-2 h-2 rounded-full bg-solana"></div>
                      Solana
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "wallet":
        return (
          <div className="mt-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot size={16} className="text-trading-highlight" />
                <span className="font-medium">Wallet Activity Tracker</span>
              </div>
              <Switch 
                checked={settings.walletTracker.enabled}
                onCheckedChange={() => toggleSetting('walletTracker', 'enabled')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Minimum Wallet Balance ($)</span>
                    <span className="text-sm font-medium">${settings.walletTracker.minimumBalance.toLocaleString()}</span>
                  </div>
                  <Slider 
                    value={[settings.walletTracker.minimumBalance]}
                    min={10000}
                    max={1000000}
                    step={10000}
                    onValueChange={(value) => updateSliderValue('walletTracker', 'minimumBalance', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Copy Confidence Threshold</span>
                    <span className="text-sm font-medium">{settings.walletTracker.copyThreshold}%</span>
                  </div>
                  <Slider 
                    value={[settings.walletTracker.copyThreshold]}
                    min={30}
                    max={90}
                    step={5}
                    onValueChange={(value) => updateSliderValue('walletTracker', 'copyThreshold', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Execution Delay (seconds)</span>
                    <span className="text-sm font-medium">{settings.walletTracker.delaySeconds}s</span>
                  </div>
                  <Slider 
                    value={[settings.walletTracker.delaySeconds]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(value) => updateSliderValue('walletTracker', 'delaySeconds', value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Max Tracked Wallets</span>
                    <span className="text-sm font-medium">{settings.walletTracker.maxWallets}</span>
                  </div>
                  <Slider 
                    value={[settings.walletTracker.maxWallets]}
                    min={1}
                    max={50}
                    step={1}
                    onValueChange={(value) => updateSliderValue('walletTracker', 'maxWallets', value)}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Max Copy Amount (%)</span>
                    <span className="text-sm font-medium">{settings.walletTracker.maxCopyAmount}%</span>
                  </div>
                  <Slider 
                    value={[settings.walletTracker.maxCopyAmount]}
                    min={5}
                    max={100}
                    step={5}
                    onValueChange={(value) => updateSliderValue('walletTracker', 'maxCopyAmount', value)}
                  />
                </div>

                <div>
                  <p className="text-sm mb-2">Target Chains</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={cn(
                        "flex items-center gap-1",
                        settings.walletTracker.targetChains.includes("solana") 
                          ? "bg-solana/20 border-solana/50 text-white" 
                          : "bg-transparent"
                      )}
                      onClick={() => toggleChain('walletTracker', 'solana')}
                    >
                      <div className="w-2 h-2 rounded-full bg-solana"></div>
                      Solana
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (enabled: boolean) => {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "ml-2",
          enabled 
            ? "bg-trading-success/20 text-trading-success border-trading-success/30" 
            : "bg-gray-800 text-gray-400 border-gray-700"
        )}
      >
        {enabled ? "Active" : "Inactive"}
      </Badge>
    );
  };

  return (
    <Card className="trading-card">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-bold">AI Trading Configuration</h3>
              <Badge className="ml-2 bg-blue-purple-gradient text-white border-none">
                AFK Mode
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">Configure your automated trading strategies</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-black/30"
              onClick={handleImport}
            >
              <Upload size={14} />
              <span>Import</span>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="gap-2 trading-button"
              onClick={handleSaveAndApply}
            >
              <Save size={14} />
              <span>Save & Apply</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="frontrun" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3 bg-trading-darkAccent">
            <TabsTrigger value="frontrun" className="relative">
              <div className="flex items-center gap-1">
                <Cpu size={14} />
                <span>Front Runner</span>
                {getStatusBadge(settings.frontRunning.enabled)}
              </div>
            </TabsTrigger>
            <TabsTrigger value="market">
              <div className="flex items-center gap-1">
                <Brain size={14} />
                <span>Market Detector</span>
                {getStatusBadge(settings.marketRunner.enabled)}
              </div>
            </TabsTrigger>
            <TabsTrigger value="wallet">
              <div className="flex items-center gap-1">
                <Bot size={14} />
                <span>Wallet Tracker</span>
                {getStatusBadge(settings.walletTracker.enabled)}
              </div>
            </TabsTrigger>
          </TabsList>

          {renderContent()}
        </Tabs>
      </div>
    </Card>
  );
};

export default AutoTradeConfig;
