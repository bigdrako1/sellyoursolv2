import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Shield,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Key,
  Database,
  Wifi,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

// Global settings interface
interface GlobalSettings {
  // Risk Management
  maxPositionSize: number;
  maxDailyLoss: number;
  maxConcurrentTrades: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;

  // Trading Parameters
  defaultSlippage: number;
  gasPrice: number;
  priorityFee: number;

  // System Settings
  enableNotifications: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  autoRestart: boolean;

  // Performance
  cacheEnabled: boolean;
  cacheTtl: number;
  rateLimitEnabled: boolean;
  maxRequestsPerMinute: number;
}

const defaultSettings: GlobalSettings = {
  maxPositionSize: 1000,
  maxDailyLoss: 500,
  maxConcurrentTrades: 5,
  stopLossPercentage: 10,
  takeProfitPercentage: 20,
  defaultSlippage: 1,
  gasPrice: 0.000005,
  priorityFee: 0.0001,
  enableNotifications: true,
  enableLogging: true,
  logLevel: 'info',
  autoRestart: true,
  cacheEnabled: true,
  cacheTtl: 60,
  rateLimitEnabled: true,
  maxRequestsPerMinute: 100
};

interface GlobalSettingsProps {
  onSettingsChange?: (settings: GlobalSettings) => void;
}

const GlobalSettingsComponent: React.FC<GlobalSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('globalAgentSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const handleSettingChange = (key: keyof GlobalSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      setHasChanges(true);
      return newSettings;
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('globalAgentSettings', JSON.stringify(settings));

      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange(settings);
      }

      setHasChanges(false);
      toast.success('Global settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings(defaultSettings);
      setHasChanges(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Global Settings</h2>
          <p className="text-gray-400">Configure default settings for all trading agents</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              Unsaved Changes
            </Badge>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            size="sm"
            className="bg-trading-highlight hover:bg-trading-highlight/80"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="risk" className="space-y-6">
        <TabsList className="bg-trading-darkAccent border-white/10">
          <TabsTrigger value="risk">Risk Management</TabsTrigger>
          <TabsTrigger value="trading">Trading Parameters</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        {/* Risk Management Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-400" />
                Risk Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure risk limits and safety parameters for all agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxPositionSize" className="text-white">Max Position Size (USDC)</Label>
                  <Input
                    id="maxPositionSize"
                    type="number"
                    value={settings.maxPositionSize}
                    onChange={(e) => handleSettingChange('maxPositionSize', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDailyLoss" className="text-white">Max Daily Loss (USDC)</Label>
                  <Input
                    id="maxDailyLoss"
                    type="number"
                    value={settings.maxDailyLoss}
                    onChange={(e) => handleSettingChange('maxDailyLoss', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentTrades" className="text-white">Max Concurrent Trades</Label>
                  <Input
                    id="maxConcurrentTrades"
                    type="number"
                    value={settings.maxConcurrentTrades}
                    onChange={(e) => handleSettingChange('maxConcurrentTrades', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stopLossPercentage" className="text-white">Stop Loss (%)</Label>
                  <Input
                    id="stopLossPercentage"
                    type="number"
                    step="0.1"
                    value={settings.stopLossPercentage}
                    onChange={(e) => handleSettingChange('stopLossPercentage', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="takeProfitPercentage" className="text-white">Take Profit (%)</Label>
                  <Input
                    id="takeProfitPercentage"
                    type="number"
                    step="0.1"
                    value={settings.takeProfitPercentage}
                    onChange={(e) => handleSettingChange('takeProfitPercentage', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
              </div>

              <Alert className="bg-red-500/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-300">
                  These risk limits will be applied to all agents. Individual agents can have more restrictive limits but cannot exceed these global limits.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trading Parameters Tab */}
        <TabsContent value="trading" className="space-y-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                Trading Parameters
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure default trading parameters and fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultSlippage" className="text-white">Default Slippage (%)</Label>
                  <Input
                    id="defaultSlippage"
                    type="number"
                    step="0.1"
                    value={settings.defaultSlippage}
                    onChange={(e) => handleSettingChange('defaultSlippage', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gasPrice" className="text-white">Gas Price (SOL)</Label>
                  <Input
                    id="gasPrice"
                    type="number"
                    step="0.000001"
                    value={settings.gasPrice}
                    onChange={(e) => handleSettingChange('gasPrice', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorityFee" className="text-white">Priority Fee (SOL)</Label>
                  <Input
                    id="priorityFee"
                    type="number"
                    step="0.0001"
                    value={settings.priorityFee}
                    onChange={(e) => handleSettingChange('priorityFee', Number(e.target.value))}
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-400" />
                System Settings
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure system behavior and performance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Notifications</Label>
                    <p className="text-sm text-gray-400">Receive notifications for agent events</p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Logging</Label>
                    <p className="text-sm text-gray-400">Log agent activities and errors</p>
                  </div>
                  <Switch
                    checked={settings.enableLogging}
                    onCheckedChange={(checked) => handleSettingChange('enableLogging', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Auto Restart</Label>
                    <p className="text-sm text-gray-400">Automatically restart failed agents</p>
                  </div>
                  <Switch
                    checked={settings.autoRestart}
                    onCheckedChange={(checked) => handleSettingChange('autoRestart', checked)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Caching</Label>
                    <p className="text-sm text-gray-400">Cache API responses for better performance</p>
                  </div>
                  <Switch
                    checked={settings.cacheEnabled}
                    onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cacheTtl" className="text-white">Cache TTL (seconds)</Label>
                    <Input
                      id="cacheTtl"
                      type="number"
                      value={settings.cacheTtl}
                      onChange={(e) => handleSettingChange('cacheTtl', Number(e.target.value))}
                      className="bg-black/20 border-white/10 text-white"
                      disabled={!settings.cacheEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRequestsPerMinute" className="text-white">Max Requests/Minute</Label>
                    <Input
                      id="maxRequestsPerMinute"
                      type="number"
                      value={settings.maxRequestsPerMinute}
                      onChange={(e) => handleSettingChange('maxRequestsPerMinute', Number(e.target.value))}
                      className="bg-black/20 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GlobalSettingsComponent;
