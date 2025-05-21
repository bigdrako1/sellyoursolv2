
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatWalletAddress } from "@/utils/walletUtils";
import { useCurrencyStore } from "@/store/currencyStore";
import { useEffect, useState } from "react";
import { getConnectedWallet } from "@/utils/walletUtils";
import { heliusApiCall } from "@/utils/apiUtils";
import { convertUsdToCurrency, formatCurrency } from "@/utils/currencyUtils";

interface PortfolioOverviewProps {
  walletData: any;
}

const PortfolioOverview = ({ walletData }: PortfolioOverviewProps) => {
  const { currency, currencySymbol } = useCurrencyStore();
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    change24h: 0,
    changePercentage: 0,
    allocation: [] as any[]
  });

  useEffect(() => {
    const fetchPortfolioData = async () => {
      const walletAddress = getConnectedWallet();

      if (walletAddress) {
        try {
          // Fetch wallet token balances from Helius
          const balanceResponse = await heliusApiCall("getTokenBalances", [walletAddress]);

          if (balanceResponse) {
            // Calculate total value from token balances
            let totalValue = 0;
            let solanaValue = 0;

            // Calculate native SOL value
            if (balanceResponse.nativeBalance) {
              const solBalance = balanceResponse.nativeBalance / 1e9; // lamports to SOL

              try {
                // Get SOL price
                const solPriceResponse = await fetch("https://price.jup.ag/v4/price?ids=SOL");
                if (solPriceResponse.ok) {
                  const solPriceData = await solPriceResponse.json();
                  const solPrice = solPriceData?.data?.SOL?.price || 0;
                  const solValue = solBalance * solPrice;

                  totalValue += solValue;
                  solanaValue += solValue;
                }
              } catch (error) {
                console.error("Failed to fetch SOL price:", error);
              }
            }

            // Calculate token values
            if (balanceResponse.tokens && Array.isArray(balanceResponse.tokens)) {
              for (const token of balanceResponse.tokens) {
                try {
                  const priceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${token.mint}`);
                  if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    const price = priceData?.data?.[token.mint]?.price || 0;

                    const balance = token.amount / Math.pow(10, token.decimals);
                    const value = balance * price;

                    totalValue += value;
                    solanaValue += value;
                  }
                } catch (error) {
                  console.error(`Failed to fetch price for token ${token.mint}:`, error);
                }
              }
            }

            // Create portfolio data object
            const newPortfolioData = {
              totalValue,
              change24h: 0, // We'd need historical data to calculate this accurately
              changePercentage: 0,
              allocation: [
                {
                  chain: "solana",
                  value: solanaValue,
                  percentage: solanaValue > 0 ? 100 : 0,
                  change24h: 0 // We'd need historical data to calculate this accurately
                }
              ]
            };

            setPortfolioData(newPortfolioData);
          }
        } catch (error) {
          console.error("Error fetching portfolio data:", error);
        }
      }
    };

    fetchPortfolioData();
  }, []);

  // Use the utility function for currency conversion
  const convertToCurrency = (value: number): number => {
    return convertUsdToCurrency(value, currency);
  };

  // Format currency with symbol and proper formatting
  const formatCurrencyValue = (value: number, options = {}): string => {
    return formatCurrency(value, currency, currencySymbol, options);
  };

  const positive = portfolioData.change24h >= 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-trading-darkAccent border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg text-gray-400 mb-2">Total Portfolio Value</h2>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{formatCurrencyValue(portfolioData.totalValue)}</span>
              <div className={`flex items-center ${positive ? 'text-trading-success' : 'text-trading-danger'}`}>
                <span className="text-sm flex items-center">
                  {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {formatCurrencyValue(Math.abs(portfolioData.change24h))}
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
                <div className="text-xl font-bold mb-1">{formatCurrencyValue(item.value)}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{item.percentage}%</span>
                  <span className={`text-sm flex items-center ${item.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                    {item.change24h >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {Math.abs(item.change24h).toFixed(1)}%
                  </span>
                </div>
              </Card>
            ))}
            {portfolioData.allocation.length === 0 && (
              <Card className="p-4 bg-black/20 border-white/5">
                <div className="text-center text-gray-400 py-2">
                  <p>No portfolio data</p>
                  <p className="text-sm mt-1">Connect your wallet to view your portfolio</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PortfolioOverview;
