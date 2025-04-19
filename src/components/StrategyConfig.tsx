
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Lock, Unlock, Settings, Save } from "lucide-react";

interface StrategyConfigProps {
  title: string;
  description: string;
  defaultEnabled?: boolean;
  onSave?: (config: StrategySettings) => void;
}

interface StrategySettings {
  enabled: boolean;
  riskLevel: number;
  maxBudget: number;
  autoReinvest: boolean;
}

const StrategyConfig = ({ 
  title, 
  description, 
  defaultEnabled = false,
  onSave 
}: StrategyConfigProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<StrategySettings>({
    enabled: defaultEnabled,
    riskLevel: 3,
    maxBudget: 0.5,
    autoReinvest: true
  });

  const handleSave = () => {
    setIsEditing(false);
    if (onSave) onSave(settings);
  };

  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-trading-highlight" />
              <h3 className="font-bold">{title}</h3>
              <Badge variant="outline" className={`${settings.enabled ? 'bg-trading-success/20 text-trading-success' : 'bg-gray-800 text-gray-400'}`}>
                {settings.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8 rounded-full"
            >
              {isEditing ? <Lock size={14} /> : <Settings size={14} />}
            </Button>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
            />
          </div>
        </div>
        
        {isEditing && (
          <div className="border-t border-white/5 pt-4 mt-2 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm">Risk Level</label>
                <span className="text-sm font-medium">
                  {settings.riskLevel === 1 ? 'Low' : settings.riskLevel === 2 ? 'Medium' : 'High'}
                </span>
              </div>
              <Slider
                value={[settings.riskLevel]}
                min={1}
                max={3}
                step={1}
                onValueChange={(value) => setSettings({...settings, riskLevel: value[0]})}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm">Max Budget (ETH)</label>
                <span className="text-sm font-medium">{settings.maxBudget.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.maxBudget]}
                min={0.1}
                max={2}
                step={0.1}
                onValueChange={(value) => setSettings({...settings, maxBudget: value[0]})}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <label className="text-sm">Auto-Reinvest Profits</label>
              <Switch
                checked={settings.autoReinvest}
                onCheckedChange={(checked) => setSettings({...settings, autoReinvest: checked})}
              />
            </div>
            
            <Button onClick={handleSave} className="w-full mt-2 trading-button">
              <Save className="h-4 w-4 mr-2" /> Save Configuration
            </Button>
          </div>
        )}
        
        {!isEditing && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-black/20 p-2 rounded text-center">
              <div className="text-xs text-gray-400">Risk Level</div>
              <div className="font-medium">
                {settings.riskLevel === 1 ? 'Low' : settings.riskLevel === 2 ? 'Medium' : 'High'}
              </div>
            </div>
            <div className="bg-black/20 p-2 rounded text-center">
              <div className="text-xs text-gray-400">Max Budget</div>
              <div className="font-medium">{settings.maxBudget.toFixed(1)} ETH</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StrategyConfig;
