
import { useState, useEffect } from "react";
import AutoTradeConfig from "@/components/AutoTradeConfig";
import TokenList from "@/components/TokenList";
import MarketChart from "@/components/MarketChart";
import StrategyConfig from "@/components/StrategyConfig";
import { StrategySettings } from "@/components/StrategyConfig";
import { useToast } from "@/hooks/use-toast";

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
    setStrategies({
      ...strategies,
      [type]: config
    });
    
    toast({
      title: "Strategy Updated",
      description: `${type === 'frontRunning' ? 'Front Running' : 'Market Detection'} strategy has been updated.`
    });
  };

  return (
    <>
      <div className="mb-6">
        <AutoTradeConfig />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StrategyConfig
          title="Front Running Strategy"
          description="Automatically detect and execute trades in advance of large pending transactions"
          defaultEnabled={strategies.frontRunning?.enabled || true}
          onSave={(config) => handleSaveStrategy('frontRunning', config)}
        />
        <StrategyConfig
          title="Market Detection"
          description="Identify early market movements and execute trades"
          defaultEnabled={strategies.marketDetection?.enabled || false}
          onSave={(config) => handleSaveStrategy('marketDetection', config)}
        />
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
