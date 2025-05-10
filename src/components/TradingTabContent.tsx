
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import AutoTradeConfig from "@/components/AutoTradeConfig";
import TradingStrategy from "@/components/TradingStrategy";
import { Zap, ShieldCheck } from "lucide-react";

const TradingTabContent = () => {
  const [maxInvestment, setMaxInvestment] = React.useState(25);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="text-lg font-semibold">Auto Trading Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="trading-enabled" className="cursor-pointer flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-500" />
                  Auto Trading Enabled
                </Label>
                <Switch id="trading-enabled" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Maximum Investment (% of wallet)</Label>
                  <span className="text-sm font-medium">{maxInvestment}%</span>
                </div>
                <Slider
                  min={5}
                  max={100}
                  step={5}
                  value={[maxInvestment]}
                  onValueChange={(value) => setMaxInvestment(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Conservative (5%)</span>
                  <span>Aggressive (100%)</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <AutoTradeConfig />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TradingStrategy />
    </div>
  );
};

export default TradingTabContent;
