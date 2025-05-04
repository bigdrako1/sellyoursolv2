
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Save, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  BarChart2,
  Activity, 
  Zap,
  Bot,
  Shield 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { secureInitialInvestment } from "@/utils/tradingUtils";

interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  performance: number;
  tradingVolume: number;
  riskLevel: number;
  profitTarget: number;
  stopLoss: number;
  secureInitial: boolean;
  secureInitialPercentage: number;
  type: string;
}

const StrategyManager = () => {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "strategy-1",
      name: "Front Running AI",
      description: "Detect and execute trades ahead of identified market movements",
      enabled: true,
      performance: 68,
      tradingVolume: 12500,
      riskLevel: 65,
      profitTarget: 8,
      stopLoss: 3,
      secureInitial: true,
      secureInitialPercentage: 100,
      type: "ai"
    },
    {
      id: "strategy-2",
      name: "Market Runner Detection",
      description: "Identify early market trends and capitalize on momentum",
      enabled: true,
      performance: 72,
      tradingVolume: 8740,
      riskLevel: 45,
      profitTarget: 12,
      stopLoss: 6,
      secureInitial: true,
      secureInitialPercentage: 75,
      type: "detection"
    },
    {
      id: "strategy-3",
      name: "Wallet Activity Tracker",
      description: "Track and mimic profitable wallet activities",
      enabled: false,
      performance: 81,
      tradingVolume: 5200,
      riskLevel: 75,
      profitTarget: 15,
      stopLoss: 8,
      secureInitial: false,
      secureInitialPercentage: 0,
      type: "tracking"
    }
  ]);
  
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(strategies[0]);
  const [activeTab, setActiveTab] = useState("active");
  
  // Load strategies from localStorage on component mount
  useEffect(() => {
    const savedStrategies = localStorage.getItem("trading_strategies");
    if (savedStrategies) {
      try {
        const parsedStrategies = JSON.parse(savedStrategies);
        setStrategies(parsedStrategies);
        // Set the first strategy as active if available
        if (parsedStrategies.length > 0) {
          setActiveStrategy(parsedStrategies[0]);
        }
      } catch (error) {
        console.error("Error parsing saved strategies:", error);
      }
    }
  }, []);
  
  const toggleStrategy = (strategyId: string) => {
    const updatedStrategies = strategies.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, enabled: !strategy.enabled } 
        : strategy
    );
    
    setStrategies(updatedStrategies);
    
    // Update localStorage
    localStorage.setItem("trading_strategies", JSON.stringify(updatedStrategies));
    
    // Show toast when enabling/disabling a strategy
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      toast({
        title: strategy.enabled ? "Strategy Disabled" : "Strategy Enabled",
        description: `${strategy.name} has been ${strategy.enabled ? 'disabled' : 'enabled'}.`,
        variant: strategy.enabled ? "destructive" : "default",
      });
    }
  };
  
  const saveStrategySettings = (updatedStrategy: Strategy) => {
    const updatedStrategies = strategies.map(strategy => 
      strategy.id === updatedStrategy.id ? updatedStrategy : strategy
    );
    
    setStrategies(updatedStrategies);
    setActiveStrategy(updatedStrategy);
    
    // Update localStorage
    localStorage.setItem("trading_strategies", JSON.stringify(updatedStrategies));
    
    // Show success toast
    toast({
      title: "Settings Saved",
      description: `${updatedStrategy.name} settings have been updated.`,
    });
  };
  
  const handleStrategySelect = (strategy: Strategy) => {
    setActiveStrategy(strategy);
  };
  
  const getStrategyIcon = (type: string) => {
    switch (type) {
      case "ai":
        return <Zap className="text-blue-400" size={18} />;
      case "detection":
        return <BarChart2 className="text-green-400" size={18} />;
      case "tracking":
        return <Bot className="text-purple-400" size={18} />;
      default:
        return <Activity className="text-gray-400" size={18} />;
    }
  };
  
  const filteredStrategies = activeTab === "active"
    ? strategies.filter(s => s.enabled)
    : activeTab === "inactive"
    ? strategies.filter(s => !s.enabled)
    : strategies;

  const secureAllInitials = () => {
    // Simulate securing all active strategies' initials
    toast({
      title: "Initial Investments Secured",
      description: "Initial investments have been secured for all active strategies.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3 bg-trading-darkAccent border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Trading Strategies</CardTitle>
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8 bg-black/20 border-white/10">
                <Plus size={16} />
              </Button>
            </div>
            <CardDescription>Configure and manage your trading algorithms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-4">
              <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveTab}>
                <TabsList className="bg-black/20 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button 
                variant="outline" 
                size="sm"
                className="ml-2 flex items-center gap-1 bg-trading-success/10 text-trading-success border-trading-success/30"
                onClick={secureAllInitials}
              >
                <Shield size={14} />
                <span>Secure All Initials</span>
              </Button>
            </div>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredStrategies.map(strategy => (
                <div 
                  key={strategy.id}
                  onClick={() => handleStrategySelect(strategy)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeStrategy?.id === strategy.id 
                      ? 'bg-white/10' 
                      : 'bg-black/20 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getStrategyIcon(strategy.type)}
                      <span className="font-medium">{strategy.name}</span>
                    </div>
                    <Switch 
                      checked={strategy.enabled} 
                      onCheckedChange={() => toggleStrategy(strategy.id)}
                      className="data-[state=checked]:bg-trading-highlight" 
                    />
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2">{strategy.description}</p>
                  
                  <div className="flex justify-between text-xs">
                    <div className={`flex items-center gap-1 ${
                      strategy.performance > 70 ? 'text-trading-success' : 
                      strategy.performance > 50 ? 'text-trading-warning' : 
                      'text-trading-danger'
                    }`}>
                      <Activity size={12} />
                      <span>{strategy.performance}% perf.</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 bg-black/20">
                      Risk: {strategy.riskLevel > 65 ? 'High' : strategy.riskLevel > 35 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>
                  
                  {strategy.secureInitial && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-trading-success">
                      <Shield size={12} className="text-trading-success" />
                      <span>Secures {strategy.secureInitialPercentage}% of initial</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:w-2/3 bg-trading-darkAccent border-white/5">
          {activeStrategy ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getStrategyIcon(activeStrategy.type)}
                      {activeStrategy.name}
                    </CardTitle>
                    <CardDescription>{activeStrategy.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${activeStrategy.enabled ? 'bg-trading-success/20 text-trading-success' : 'bg-gray-500/20 text-gray-400'}`}>
                      {activeStrategy.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="outline" size="sm" className="bg-black/20 border-white/10">
                      <Settings size={14} className="mr-2" />
                      Advanced
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-6 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Performance</div>
                      <div className="text-2xl font-bold mb-1">{activeStrategy.performance}%</div>
                      <div className={`text-xs flex items-center ${
                        activeStrategy.performance >= 60 ? 'text-trading-success' : 'text-trading-danger'
                      }`}>
                        {activeStrategy.performance >= 60 
                          ? <ChevronUp size={14} /> 
                          : <ChevronDown size={14} />}
                        {Math.abs(activeStrategy.performance - 50)}% from baseline
                      </div>
                    </div>
                    
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Trading Volume</div>
                      <div className="text-2xl font-bold mb-1">${activeStrategy.tradingVolume.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">Last 30 days</div>
                    </div>
                    
                    <div className="bg-black/20 p-4 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                      <div className="text-2xl font-bold mb-1">{activeStrategy.riskLevel}%</div>
                      <div className="text-xs text-gray-400">
                        {activeStrategy.riskLevel > 65 ? 'High' : activeStrategy.riskLevel > 35 ? 'Medium' : 'Low'} risk profile
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="profitTarget">Profit Target: {activeStrategy.profitTarget}%</Label>
                      </div>
                      <Slider 
                        id="profitTarget"
                        min={1} 
                        max={30} 
                        step={1}
                        value={[activeStrategy.profitTarget]}
                        onValueChange={(value) => setActiveStrategy({...activeStrategy, profitTarget: value[0]})}
                        className="mb-6"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="stopLoss">Stop Loss: {activeStrategy.stopLoss}%</Label>
                      </div>
                      <Slider 
                        id="stopLoss"
                        min={1} 
                        max={20} 
                        step={1}
                        value={[activeStrategy.stopLoss]}
                        onValueChange={(value) => setActiveStrategy({...activeStrategy, stopLoss: value[0]})}
                        className="mb-6"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="riskLevel">Risk Level: {activeStrategy.riskLevel}%</Label>
                      </div>
                      <Slider 
                        id="riskLevel"
                        min={10} 
                        max={90} 
                        step={5}
                        value={[activeStrategy.riskLevel]}
                        onValueChange={(value) => setActiveStrategy({...activeStrategy, riskLevel: value[0]})}
                        className="mb-6"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <Label htmlFor="secureInitial" className="flex items-center gap-2">
                        <Shield size={16} className={activeStrategy.secureInitial ? 'text-trading-success' : 'text-gray-400'} />
                        Secure Initial Investment
                      </Label>
                      <Switch 
                        id="secureInitial"
                        checked={activeStrategy.secureInitial}
                        onCheckedChange={(checked) => setActiveStrategy({...activeStrategy, secureInitial: checked})}
                      />
                    </div>
                    
                    {activeStrategy.secureInitial && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="securePercentage">Secure Initial Percentage: {activeStrategy.secureInitialPercentage}%</Label>
                        </div>
                        <Slider 
                          id="securePercentage"
                          min={25} 
                          max={100} 
                          step={25}
                          value={[activeStrategy.secureInitialPercentage]}
                          onValueChange={(value) => setActiveStrategy({...activeStrategy, secureInitialPercentage: value[0]})}
                          className="mb-6"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => saveStrategySettings(activeStrategy)} className="flex items-center gap-2">
                      <Save size={14} />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <Settings className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium mb-1">No Strategy Selected</h3>
                <p className="text-sm text-gray-400">Select a strategy from the list to configure its settings</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StrategyManager;
