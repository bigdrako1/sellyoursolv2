import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferencesStore } from '@/store/userPreferencesStore';
import { TrendingUp, ArrowUpRight, Wallet, Shield, Settings, Save, AlertTriangle } from 'lucide-react';

interface SimpleTradeStrategyProps {
  onSave?: () => void;
}

const SimpleTradeStrategy: React.FC<SimpleTradeStrategyProps> = ({ onSave }) => {
  const { tradingPreferences, updateTradingPreferences } = useUserPreferencesStore();
  const { toast } = useToast();
  
  // Local state for form values
  const [stopLoss, setStopLoss] = useState(tradingPreferences.stopLossPercentage);
  const [useTrailingStop, setUseTrailingStop] = useState(tradingPreferences.useTrailingStopLoss);
  const [trailingDistance, setTrailingDistance] = useState(tradingPreferences.trailingStopLossDistance);
  const [scaleOutEnabled, setScaleOutEnabled] = useState(tradingPreferences.scaleOutEnabled);
  const [scaleOutLevels, setScaleOutLevels] = useState(tradingPreferences.scaleOutLevels);
  
  // Update local state when preferences change
  useEffect(() => {
    setStopLoss(tradingPreferences.stopLossPercentage);
    setUseTrailingStop(tradingPreferences.useTrailingStopLoss);
    setTrailingDistance(tradingPreferences.trailingStopLossDistance);
    setScaleOutEnabled(tradingPreferences.scaleOutEnabled);
    setScaleOutLevels(tradingPreferences.scaleOutLevels);
  }, [tradingPreferences]);
  
  // Handle save
  const handleSave = () => {
    updateTradingPreferences({
      stopLossPercentage: stopLoss,
      useTrailingStopLoss: useTrailingStop,
      trailingStopLossDistance: trailingDistance,
      scaleOutEnabled,
      scaleOutLevels
    });
    
    toast({
      title: "Strategy Saved",
      description: "Your trading strategy has been updated",
    });
    
    if (onSave) {
      onSave();
    }
  };
  
  // Handle scale out level change
  const handleScaleOutLevelChange = (index: number, field: 'multiplier' | 'percentage', value: number) => {
    const updatedLevels = [...scaleOutLevels];
    updatedLevels[index] = {
      ...updatedLevels[index],
      [field]: value
    };
    setScaleOutLevels(updatedLevels);
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Simple Trading Strategy
        </CardTitle>
        <CardDescription>
          Configure your trading strategy with automatic scale-out and stop loss
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Strategy Description */}
        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-trading-highlight" />
            Strategy Overview
          </h3>
          <p className="text-sm text-gray-400 mb-2">
            This strategy buys tokens and automatically scales out at predefined profit levels:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 ml-5 list-disc">
            <li>Sell 50% of position at 2x initial investment</li>
            <li>Scale out at 3x, 4x, and 5x based on token performance</li>
            <li>Protect downside with stop loss or trailing stop loss</li>
          </ul>
        </div>
        
        {/* Stop Loss Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-trading-highlight" />
            Risk Management
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between mb-1">
              <Label htmlFor="stop-loss">Stop Loss (%)</Label>
              <span className="text-sm font-medium">{stopLoss}%</span>
            </div>
            <Slider
              id="stop-loss"
              min={5}
              max={50}
              step={1}
              value={[stopLoss]}
              onValueChange={(values) => setStopLoss(values[0])}
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Automatically sell if price drops by this percentage from entry
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trailing-stop">Use Trailing Stop Loss</Label>
              <p className="text-xs text-gray-400">
                Stop loss that follows price upward to lock in profits
              </p>
            </div>
            <Switch
              id="trailing-stop"
              checked={useTrailingStop}
              onCheckedChange={setUseTrailingStop}
            />
          </div>
          
          {useTrailingStop && (
            <div className="space-y-2 pl-4 border-l border-white/10">
              <div className="flex justify-between mb-1">
                <Label htmlFor="trailing-distance">Trailing Distance (%)</Label>
                <span className="text-sm font-medium">{trailingDistance}%</span>
              </div>
              <Slider
                id="trailing-distance"
                min={5}
                max={30}
                step={1}
                value={[trailingDistance]}
                onValueChange={(values) => setTrailingDistance(values[0])}
                className="w-full"
              />
              <p className="text-xs text-gray-400">
                Distance the stop loss trails behind the highest price
              </p>
            </div>
          )}
        </div>
        
        {/* Scale Out Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="scale-out">Enable Scale Out</Label>
              <p className="text-xs text-gray-400">
                Automatically take profits at predefined levels
              </p>
            </div>
            <Switch
              id="scale-out"
              checked={scaleOutEnabled}
              onCheckedChange={setScaleOutEnabled}
            />
          </div>
          
          {scaleOutEnabled && (
            <div className="space-y-4 pl-4 border-l border-white/10">
              <h4 className="text-sm font-medium">Scale Out Levels</h4>
              
              {scaleOutLevels.map((level, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`multiplier-${index}`}>At {level.multiplier}x</Label>
                    <Input
                      id={`multiplier-${index}`}
                      type="number"
                      min={1.5}
                      max={10}
                      step={0.5}
                      value={level.multiplier}
                      onChange={(e) => handleScaleOutLevelChange(index, 'multiplier', parseFloat(e.target.value))}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`percentage-${index}`}>Sell {level.percentage}%</Label>
                    <Input
                      id={`percentage-${index}`}
                      type="number"
                      min={5}
                      max={100}
                      step={5}
                      value={level.percentage}
                      onChange={(e) => handleScaleOutLevelChange(index, 'percentage', parseFloat(e.target.value))}
                      className="h-8"
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex items-center p-2 bg-black/20 rounded border border-white/10">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Total percentage should add up to 100% for complete exit
                </p>
              </div>
            </div>
          )}
        </div>
        
        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Strategy
        </Button>
      </CardContent>
    </Card>
  );
};

export default SimpleTradeStrategy;
