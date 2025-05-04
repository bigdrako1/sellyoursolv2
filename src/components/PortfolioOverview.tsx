
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatWalletAddress } from "@/utils/walletUtils";
import { useCurrencyStore } from "@/store/currencyStore";

interface PortfolioOverviewProps {
  walletData: any;
}

const PortfolioOverview = ({ walletData }: PortfolioOverviewProps) => {
  const { currency, currencySymbol } = useCurrencyStore();

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };

  // Sample portfolio data if real data isn't available
  const portfolioData = walletData || {
    totalValue: 4825.92,
    change24h: 328.76,
    changePercentage: 7.3,
    allocation: [
      { chain: "solana", value: 2937.48, percentage: 100, change24h: 8.2 }
    ]
  };

  const positive = portfolioData.change24h >= 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-trading-darkAccent border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg text-gray-400 mb-2">Total Portfolio Value</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{currencySymbol}{convertToCurrency(portfolioData.totalValue).toLocaleString()}</span>
              <div className={`flex items-center ${positive ? 'text-trading-success' : 'text-trading-danger'}`}>
                <span className="text-sm flex items-center">
                  {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {currencySymbol}{Math.abs(convertToCurrency(portfolioData.change24h)).toLocaleString()}
                </span>
                <span className="text-sm ml-1">
                  ({positive ? '+' : '-'}{Math.abs(portfolioData.changePercentage).toFixed(1)}%)
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">24h Change</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {portfolioData.allocation && portfolioData.allocation.map((item: any, index: number) => (
              <Card key={index} className="p-4 bg-black/20 border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-solana"></div>
                  <h3 className="font-medium capitalize">Solana</h3>
                </div>
                <div className="text-xl font-bold mb-1">{currencySymbol}{convertToCurrency(item.value).toLocaleString()}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{item.percentage}%</span>
                  <span className={`text-sm flex items-center ${item.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                    {item.change24h >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {Math.abs(item.change24h).toFixed(1)}%
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
