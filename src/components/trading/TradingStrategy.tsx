import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Bot, 
  Brain, 
  Gauge, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Zap, 
  Shield, 
  AlertTriangle,
  Save
} from "lucide-react";
import StrategyCard from "./StrategyCard";
import StrategySection from "./StrategySection";
import StrategyToggle from "./StrategyToggle";
import StrategySlider from "./StrategySlider";

interface TradingStrategyProps {
  onSave?: (settings: any) => void;
}

const TradingStrategy: React.FC<TradingStrategyProps> = ({ onSave }) => {
  // Strategy settings state
  const [settings, setSettings] = useState({
    enabled: true,
    aiAssisted: true,
    riskLevel: [3], // 1-5 scale
    maxPositionSize: [10], // Percentage of portfolio
    stopLoss: [5], // Percentage
    takeProfit: [15], // Percentage
    trailingStop: true,
    dynamicPositionSizing: true,
    autoRebalance: false,
    tradingHours: {
      allHours: true,
      specificHours: false
    },
    marketConditions: {
      bull: true,
      bear: true,
      sideways: true
    }
  });

  // Update settings handlers
  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const handleSaveStrategy = () => {
    if (onSave) {
      onSave(settings);
    }
    
    toast.success("Strategy settings saved successfully");
  };

  return (
    <StrategyCard 
      title="Trading Strategy" 
      icon={Bot} 
      iconColor="text-purple-400"
      headerAction={
        <Button 
          size="sm" 
          onClick={handleSaveStrategy}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Strategy
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">Strategy Status</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              settings.enabled ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {settings.enabled ? 'Active' : 'Inactive'}
            </span>
          </div>
          <StrategyToggle
            id="strategy-enabled"
            label="Enable Strategy"
            icon={Zap}
            iconColor="text-yellow-400"
            checked={settings.enabled}
            onChange={() => updateSetting('enabled', !settings.enabled)}
          />
        </div>

        <StrategySection title="AI Configuration" icon={Brain} iconColor="text-blue-400">
          <StrategyToggle
            id="ai-assisted"
            label="AI-Assisted Trading"
            icon={Brain}
            iconColor="text-blue-400"
            checked={settings.aiAssisted}
            onChange={() => updateSetting('aiAssisted', !settings.aiAssisted)}
            description="Use AI to analyze market conditions and optimize entry/exit points"
          />
        </StrategySection>

        <StrategySection title="Risk Management" icon={Shield} iconColor="text-red-400">
          <StrategySlider
            id="risk-level"
            label="Risk Level"
            icon={Gauge}
            iconColor="text-red-400"
            value={settings.riskLevel}
            onChange={(value) => updateSetting('riskLevel', value)}
            min={1}
            max={5}
            step={1}
            valueDisplay={`${settings.riskLevel[0]}/5`}
            description="Higher risk may yield higher returns but with increased volatility"
          />
          
          <StrategySlider
            id="max-position-size"
            label="Max Position Size"
            icon={DollarSign}
            iconColor="text-green-400"
            value={settings.maxPositionSize}
            onChange={(value) => updateSetting('maxPositionSize', value)}
            min={1}
            max={50}
            step={1}
            valueDisplay={`${settings.maxPositionSize[0]}%`}
            description="Maximum percentage of portfolio allocated to a single position"
          />
          
          <StrategySlider
            id="stop-loss"
            label="Stop Loss"
            icon={AlertTriangle}
            iconColor="text-orange-400"
            value={settings.stopLoss}
            onChange={(value) => updateSetting('stopLoss', value)}
            min={1}
            max={20}
            step={1}
            valueDisplay={`${settings.stopLoss[0]}%`}
            description="Automatically sell if position drops by this percentage"
          />
          
          <StrategySlider
            id="take-profit"
            label="Take Profit"
            icon={DollarSign}
            iconColor="text-green-400"
            value={settings.takeProfit}
            onChange={(value) => updateSetting('takeProfit', value)}
            min={5}
            max={50}
            step={5}
            valueDisplay={`${settings.takeProfit[0]}%`}
            description="Automatically sell if position gains by this percentage"
          />
          
          <StrategyToggle
            id="trailing-stop"
            label="Trailing Stop Loss"
            icon={BarChart3}
            iconColor="text-blue-400"
            checked={settings.trailingStop}
            onChange={() => updateSetting('trailingStop', !settings.trailingStop)}
            description="Dynamically adjust stop loss as price moves in your favor"
          />
          
          <StrategyToggle
            id="dynamic-position-sizing"
            label="Dynamic Position Sizing"
            icon={Gauge}
            iconColor="text-purple-400"
            checked={settings.dynamicPositionSizing}
            onChange={() => updateSetting('dynamicPositionSizing', !settings.dynamicPositionSizing)}
            description="Adjust position size based on market volatility and confidence"
          />
        </StrategySection>

        <StrategySection title="Trading Conditions" icon={Clock} iconColor="text-yellow-400">
          <StrategyToggle
            id="all-hours"
            label="Trade 24/7"
            icon={Clock}
            iconColor="text-yellow-400"
            checked={settings.tradingHours.allHours}
            onChange={() => {
              updateNestedSetting('tradingHours', 'allHours', !settings.tradingHours.allHours);
              if (!settings.tradingHours.allHours) {
                updateNestedSetting('tradingHours', 'specificHours', false);
              }
            }}
          />
          
          <StrategyToggle
            id="specific-hours"
            label="Trade During Specific Hours"
            icon={Clock}
            iconColor="text-blue-400"
            checked={settings.tradingHours.specificHours}
            onChange={() => updateNestedSetting('tradingHours', 'specificHours', !settings.tradingHours.specificHours)}
            disabled={settings.tradingHours.allHours}
          />
          
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-md p-2 mt-2">
            <p className="text-xs text-blue-300 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
              Trading during high volatility periods may increase both risk and potential returns
            </p>
          </div>
        </StrategySection>
      </div>
    </StrategyCard>
  );
};

export default TradingStrategy;
