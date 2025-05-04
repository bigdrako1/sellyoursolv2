
import { useState, useEffect } from "react";
import TokenList from "@/components/TokenList";
import MarketChart from "@/components/MarketChart";
import StrategyConfig from "@/components/StrategyConfig";
import { StrategySettings } from "@/components/StrategyConfig";
import { useToast } from "@/hooks/use-toast";
import { secureInitialInvestment } from "@/utils/tradingUtils";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const TradingTab = () => {
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<{[key: string]: StrategySettings}>({});
  
  // Load saved strategies from localStorage
  useEffect(() => {
    const loadStrategies = () => {
      const frontRunningKey = 'strategy_front_running_strategy';
      const marketDetectionKey = 'strategy_market_detection';
      
      const frontRunning = localStorage.getItem(frontRunningKey);
      const marketDetection = localStorage.getItem(marketDetectionKey);
      
      const loadedStrategies: {[key: string]: StrategySettings} = {};
      
      if (frontRunning) {
        try {
          loadedStrategies.frontRunning = JSON.parse(frontRunning);
        } catch (e) {
          console.error("Error parsing front running strategy:", e);
        }
      }
      
      if (marketDetection) {
        try {
          loadedStrategies.marketDetection = JSON.parse(marketDetection);
        } catch (e) {
          console.error("Error parsing market detection strategy:", e);
        }
      }
      
      setStrategies(loadedStrategies);
    };
    
    loadStrategies();
  }, []);
  
  const handleSaveStrategy = (type: string, config: StrategySettings) => {
    const updatedStrategies = {
      ...strategies,
      [type]: config
    };
    
    setStrategies(updatedStrategies);
    
    // Save to localStorage for persistence
    const strategyKey = `strategy_${type.toLowerCase().replace(/\s+/g, '_')}`;
    localStorage.setItem(strategyKey, JSON.stringify(config));
    
    // Apply secure initial investment logic if enabled
    if (config.enabled && config.secureInitial && config.profitTarget) {
      const position = {
        initial_investment: config.maxBudget || 0.5,
        entry_price: 0, // Will be updated with real price data
        current_amount: config.maxBudget || 0.5
      };
      
      secureInitialInvestment(position, 0, config.secureInitialPercentage);
    }
    
    toast({
      title: "Strategy Updated",
      description: `${type === 'frontRunning' ? 'Front Running' : 'Market Detection'} strategy has been updated.`
    });
  };

  const handleSecureAll = () => {
    // Implement secure all functionality for all active strategies
    Object.entries(strategies).forEach(([type, strategy]) => {
      if (strategy.enabled && strategy.secureInitial) {
        // Update the strategy with secure settings
        handleSaveStrategy(type, {
          ...strategy,
          secureInitial: true,
          secureInitialPercentage: strategy.secureInitialPercentage || 100
        });
      }
    });
    
    toast({
      title: "Initial Investments Secured",
      description: "Initial investments have been secured for all active strategies."
    });
  };

  // Check if any strategies are enabled and have secure initial enabled
  const anyStrategiesWithSecureInitial = Object.values(strategies).some(
    strategy => strategy.enabled && strategy.secureInitial
  );

  return (
    <>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StrategyConfig
            title="Front Running Strategy"
            description="Automatically detect and execute trades in advance of large pending transactions"
            defaultEnabled={strategies.frontRunning?.enabled || false}
            onSave={(config) => handleSaveStrategy('frontRunning', config)}
          />
          <StrategyConfig
            title="Market Detection"
            description="Identify early market movements and execute trades"
            defaultEnabled={strategies.marketDetection?.enabled || false}
            onSave={(config) => handleSaveStrategy('marketDetection', config)}
          />
        </div>
        
        {anyStrategiesWithSecureInitial && (
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-trading-success/10 text-trading-success border-trading-success/30 flex items-center gap-1 hover:bg-trading-success/20"
              onClick={handleSecureAll}
            >
              <Shield size={14} />
              <span>Secure All Initial Investments</span>
            </Button>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <TokenList />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <MarketChart symbol="SOL/USD" chain="solana" />
      </div>
    </>
  );
};

export default TradingTab;
