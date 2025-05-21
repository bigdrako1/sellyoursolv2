import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-trading-highlight" />
                <span className="text-sm font-medium">Front-Running Bot</span>
                {getStatusBadge(settings.frontRunning.enabled)}
              </div>
              <Switch
                checked={settings.frontRunning.enabled}
                onCheckedChange={() => toggleSetting('frontRunning', 'enabled')}
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Detection Sensitivity</span>
                  <span className="text-xs font-medium">{settings.frontRunning.sensitivity}%</span>
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
                  <span className="text-xs">Max Gas Price</span>
                  <span className="text-xs font-medium">{settings.frontRunning.maxGasPrice}</span>
                </div>
                <Slider
                  value={[settings.frontRunning.maxGasPrice]}
                  min={10}
                  max={200}
                  step={5}
                  onValueChange={(value) => updateSliderValue('frontRunning', 'maxGasPrice', value)}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs">Auto-adjust Gas</span>
                <Switch
                  checked={settings.frontRunning.autoAdjustGas}
                  onCheckedChange={() => toggleSetting('frontRunning', 'autoAdjustGas')}
                />
              </div>

              <div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-solana"></div>
                  <span className="text-xs">Solana Chain</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "market":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={14} className="text-trading-highlight" />
                <span className="text-sm font-medium">Market Detector</span>
                {getStatusBadge(settings.marketRunner.enabled)}
              </div>
              <Switch
                checked={settings.marketRunner.enabled}
                onCheckedChange={() => toggleSetting('marketRunner', 'enabled')}
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Detection Threshold</span>
                  <span className="text-xs font-medium">{settings.marketRunner.detectionThreshold}%</span>
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
                  <span className="text-xs">Reaction Speed</span>
                  <span className="text-xs font-medium">{settings.marketRunner.reactionSpeed}%</span>
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
                  <span className="text-xs">Stop-Loss</span>
                  <span className="text-xs font-medium">{settings.marketRunner.stopLoss}%</span>
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
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-solana"></div>
                  <span className="text-xs">Solana Chain</span>
                </div>
              </div>
            </div>
          </div>
        );
      case "wallet":
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-trading-highlight" />
                <span className="text-sm font-medium">Wallet Tracker</span>
                {getStatusBadge(settings.walletTracker.enabled)}
              </div>
              <Switch
                checked={settings.walletTracker.enabled}
                onCheckedChange={() => toggleSetting('walletTracker', 'enabled')}
              />
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Min Balance</span>
                  <span className="text-xs font-medium">${(settings.walletTracker.minimumBalance/1000).toFixed(0)}K</span>
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
                  <span className="text-xs">Copy Threshold</span>
                  <span className="text-xs font-medium">{settings.walletTracker.copyThreshold}%</span>
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
                  <span className="text-xs">Max Copy Amount</span>
                  <span className="text-xs font-medium">{settings.walletTracker.maxCopyAmount}%</span>
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
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-solana"></div>
                  <span className="text-xs">Solana Chain</span>
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
          "text-xs px-1.5 py-0 h-5 flex-shrink-0",
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">AI Trading</h3>
          <Badge className="bg-blue-purple-gradient text-white border-none text-xs px-1.5 py-0">
            AFK
          </Badge>
        </div>
        <Button
          variant="default"
          size="sm"
          className="h-7 px-2 text-xs trading-button"
          onClick={handleSaveAndApply}
        >
          <Save size={12} className="mr-1" />
          Save
        </Button>
      </div>

      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger className="w-full bg-trading-darkAccent border-none">
          <SelectValue placeholder="Select strategy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="frontrun">
            <div className="flex items-center gap-2">
              <Cpu size={14} />
              <span>Front Runner</span>
              {settings.frontRunning.enabled && (
                <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-400 text-xs border-green-500/30">
                  Active
                </Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="market">
            <div className="flex items-center gap-2">
              <Brain size={14} />
              <span>Market Detector</span>
              {settings.marketRunner.enabled && (
                <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-400 text-xs border-green-500/30">
                  Active
                </Badge>
              )}
            </div>
          </SelectItem>
          <SelectItem value="wallet">
            <div className="flex items-center gap-2">
              <Bot size={14} />
              <span>Wallet Tracker</span>
              {settings.walletTracker.enabled && (
                <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-400 text-xs border-green-500/30">
                  Active
                </Badge>
              )}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="pt-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default AutoTradeConfig;
