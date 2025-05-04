
import AutoTradeConfig from "@/components/AutoTradeConfig";
import TokenList from "@/components/TokenList";
import MarketChart from "@/components/MarketChart";
import StrategyConfig from "@/components/StrategyConfig";

const TradingTab = () => {
  return (
    <>
      <div className="mb-6">
        <AutoTradeConfig />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <StrategyConfig
          title="Front Running Strategy"
          description="Automatically detect and execute trades in advance of large pending transactions"
          defaultEnabled={true}
        />
        <StrategyConfig
          title="Market Detection"
          description="Identify early market movements and execute trades"
          defaultEnabled={false}
        />
      </div>
      
      <div className="mb-6">
        <TokenList />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MarketChart symbol="SOL/USD" chain="solana" />
        <MarketChart symbol="BNB/USD" chain="binance" />
      </div>
    </>
  );
};

export default TradingTab;
