
import AutoTradeConfig from "@/components/AutoTradeConfig";
import TokenList from "@/components/TokenList";
import MarketChart from "@/components/MarketChart";

const TradingTab = () => {
  return (
    <>
      <div className="mb-6">
        <AutoTradeConfig />
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
