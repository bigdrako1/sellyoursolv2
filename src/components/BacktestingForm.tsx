import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, BarChart2, LineChart, TrendingUp, Settings, Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BacktestParams, TradingStrategy } from "@/types/backtesting";
import { getAvailableStrategies, getAvailableSymbols, getAvailableTimeframes } from "@/services/backtestingService";
import { toast } from "sonner";

interface BacktestingFormProps {
  onRunBacktest: (params: BacktestParams) => Promise<void>;
  isRunning: boolean;
}

const BacktestingForm: React.FC<BacktestingFormProps> = ({ onRunBacktest, isRunning }) => {
  // Available options
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [availableTimeframes, setAvailableTimeframes] = useState<string[]>([]);
  const [availableStrategies, setAvailableStrategies] = useState<TradingStrategy[]>([]);
  
  // Form state
  const [symbol, setSymbol] = useState<string>("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [initialCapital, setInitialCapital] = useState<number>(1000);
  const [selectedStrategy, setSelectedStrategy] = useState<string>("");
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({});
  
  // Risk management settings
  const [stopLossPercentage, setStopLossPercentage] = useState<number>(10);
  const [takeProfitPercentage, setTakeProfitPercentage] = useState<number>(20);
  const [useTrailingStopLoss, setUseTrailingStopLoss] = useState<boolean>(false);
  const [trailingStopLossDistance, setTrailingStopLossDistance] = useState<number>(5);
  const [positionSizePercentage, setPositionSizePercentage] = useState<number>(10);
  const [maxOpenPositions, setMaxOpenPositions] = useState<number>(1);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  // Load available options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const symbols = await getAvailableSymbols();
        const timeframes = getAvailableTimeframes();
        const strategies = getAvailableStrategies();
        
        setAvailableSymbols(symbols);
        setAvailableTimeframes(timeframes);
        setAvailableStrategies(strategies);
        
        // Set defaults
        if (symbols.length > 0) setSymbol(symbols[0]);
        if (timeframes.length > 0) setTimeframe(timeframes[3]); // Default to 1h
        if (strategies.length > 0) {
          setSelectedStrategy(strategies[0].name);
          setStrategyParams(strategies[0].params);
        }
      } catch (error) {
        console.error("Error loading backtest options:", error);
        toast.error("Failed to load backtest options");
      }
    };
    
    loadOptions();
  }, []);
  
  // Update strategy params when strategy changes
  useEffect(() => {
    const strategy = availableStrategies.find(s => s.name === selectedStrategy);
    if (strategy) {
      setStrategyParams(strategy.params);
    }
  }, [selectedStrategy, availableStrategies]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symbol || !timeframe || !selectedStrategy) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const params: BacktestParams = {
      symbol,
      timeframe,
      startDate,
      endDate,
      initialCapital,
      strategyName: selectedStrategy,
      strategyParams,
      riskManagement: {
        stopLossPercentage,
        takeProfitPercentage,
        trailingStopLoss: useTrailingStopLoss,
        trailingStopLossDistance: useTrailingStopLoss ? trailingStopLossDistance : null,
        positionSizePercentage,
        maxOpenPositions
      }
    };
    
    onRunBacktest(params);
  };
  
  // Update a strategy parameter
  const updateStrategyParam = (key: string, value: any) => {
    setStrategyParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-400" />
          Backtesting
        </CardTitle>
        <CardDescription>
          Test trading strategies against historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-black/20 border-white/10 border">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="risk">Risk Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger id="symbol">
                      <SelectValue placeholder="Select symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSymbols.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeframes.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initialCapital">Initial Capital</Label>
                <Input
                  id="initialCapital"
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  min={100}
                  step={100}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="strategy" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="strategy">Trading Strategy</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger id="strategy">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStrategies.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedStrategy && (
                  <p className="text-sm text-gray-400 mt-1">
                    {availableStrategies.find(s => s.name === selectedStrategy)?.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">Strategy Parameters</h3>
                
                {Object.entries(strategyParams).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    <Input
                      id={key}
                      type="number"
                      value={value}
                      onChange={(e) => updateStrategyParam(key, Number(e.target.value))}
                      min={1}
                      step={1}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="stopLoss">Stop Loss: {stopLossPercentage}%</Label>
                </div>
                <Slider
                  id="stopLoss"
                  min={1}
                  max={50}
                  step={1}
                  value={[stopLossPercentage]}
                  onValueChange={(value) => setStopLossPercentage(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="takeProfit">Take Profit: {takeProfitPercentage}%</Label>
                </div>
                <Slider
                  id="takeProfit"
                  min={1}
                  max={100}
                  step={1}
                  value={[takeProfitPercentage]}
                  onValueChange={(value) => setTakeProfitPercentage(value[0])}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="trailingStopLoss"
                  checked={useTrailingStopLoss}
                  onCheckedChange={setUseTrailingStopLoss}
                />
                <Label htmlFor="trailingStopLoss">Use Trailing Stop Loss</Label>
              </div>
              
              {useTrailingStopLoss && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="trailingDistance">
                      Trailing Distance: {trailingStopLossDistance}%
                    </Label>
                  </div>
                  <Slider
                    id="trailingDistance"
                    min={1}
                    max={20}
                    step={1}
                    value={[trailingStopLossDistance]}
                    onValueChange={(value) => setTrailingStopLossDistance(value[0])}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="positionSize">
                    Position Size: {positionSizePercentage}% of capital
                  </Label>
                </div>
                <Slider
                  id="positionSize"
                  min={1}
                  max={100}
                  step={1}
                  value={[positionSizePercentage]}
                  onValueChange={(value) => setPositionSizePercentage(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxPositions">Max Open Positions</Label>
                <Input
                  id="maxPositions"
                  type="number"
                  value={maxOpenPositions}
                  onChange={(e) => setMaxOpenPositions(Number(e.target.value))}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Backtest
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default BacktestingForm;
