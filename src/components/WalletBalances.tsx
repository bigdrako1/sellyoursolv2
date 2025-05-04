
import { useEffect, useState } from "react";
import { getWalletBalances, WalletData, TokenData } from "@/utils/walletUtils";
import { ChevronUp, ChevronDown, Wallet } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { heliusRpcCall } from "@/utils/apiUtils";
import { parseHeliusWalletBalance, HeliusWalletBalance } from "@/utils/heliusTypes";

const WalletBalances = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currency, currencySymbol } = useCurrencyStore();

  useEffect(() => {
    const loadWalletData = async () => {
      setIsLoading(true);
      try {
        const connectedAddress = localStorage.getItem('walletAddress');
        if (connectedAddress) {
          // Get wallet token balances from Helius API
          try {
            const balanceResponse = await heliusRpcCall("getTokenBalances", [connectedAddress]);
            const parsedBalanceResponse = parseHeliusWalletBalance(balanceResponse);
            
            if (parsedBalanceResponse) {
              // Process the balance data
              const nativeBalance = parsedBalanceResponse.nativeBalance ? 
                parsedBalanceResponse.nativeBalance / 1000000000 : 0; // Convert from lamports to SOL
              
              // Process token balances
              const processedTokens: TokenData[] = [];
              
              if (parsedBalanceResponse.tokens && Array.isArray(parsedBalanceResponse.tokens)) {
                for (const token of parsedBalanceResponse.tokens) {
                  if (token.mint && token.amount) {
                    // Get token price data (in a real app, we'd use a price API)
                    const priceResponse = await fetch(`https://price.jup.ag/v4/price?ids=${token.mint}`);
                    const priceData = await priceResponse.json();
                    
                    const price = priceData?.data?.[token.mint]?.price || 0;
                    const balance = token.amount / Math.pow(10, token.decimals || 9);
                    const usdValue = balance * price;
                    
                    processedTokens.push({
                      symbol: token.symbol || token.mint.substring(0, 4),
                      balance,
                      usdValue,
                      price,
                      change24h: Math.random() * 10 - 5, // Mock 24h change until we have a real API
                      logo: token.logo
                    });
                  }
                }
              }
              
              // Calculate total USD value
              const solValue = nativeBalance * 100; // Assuming SOL is $100
              const tokenTotalValue = processedTokens.reduce((sum, token) => sum + token.usdValue, 0);
              const totalUsdValue = solValue + tokenTotalValue;
              
              setWalletData({
                address: connectedAddress,
                balance: nativeBalance,
                tokens: processedTokens,
                totalUsdValue
              });
            } else {
              console.error("Invalid response format from Helius API");
              throw new Error("Invalid response format");
            }
          } catch (apiError) {
            console.error("API error fetching wallet data:", apiError);
            // Fall back to mock data from walletUtils
            const data = await getWalletBalances(connectedAddress);
            setWalletData(data);
          }
        }
      } catch (error) {
        console.error("Failed to load wallet data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, []);

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56,
      KES: 129.45
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-white/5 rounded-lg h-10 mb-6"></div>
        <div className="animate-pulse bg-white/5 rounded-lg h-16"></div>
        <div className="animate-pulse bg-white/5 rounded-lg h-16"></div>
        <div className="animate-pulse bg-white/5 rounded-lg h-16"></div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="text-center p-6 bg-black/20 rounded-lg border border-white/10">
        <Wallet className="mx-auto h-10 w-10 text-gray-500 mb-2" />
        <h3 className="text-lg font-medium">No Wallet Connected</h3>
        <p className="text-sm text-gray-400 mt-1">Connect a wallet to view your balances</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-trading-highlight" />
            <h4 className="font-medium">Wallet Balance</h4>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total Value</div>
            <div className="font-bold text-lg">{currencySymbol}{convertToCurrency(walletData.totalUsdValue).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">SOL</span>
            </div>
            <div>
              <div className="font-medium">Solana</div>
              <div className="text-xs text-gray-400">{walletData.balance.toFixed(4)} SOL</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{currencySymbol}{convertToCurrency(walletData.balance * 100).toFixed(2)}</div>
          </div>
        </div>

        {walletData.tokens.map((token: TokenData, index) => (
          <div key={index} className="bg-black/20 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-trading-darkAccent rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{token.symbol.substring(0, 3)}</span>
              </div>
              <div>
                <div className="font-medium">{token.symbol}</div>
                <div className="text-xs text-gray-400">{token.balance.toFixed(2)} tokens</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">{currencySymbol}{convertToCurrency(token.usdValue).toFixed(2)}</div>
              {token.change24h !== undefined && (
                <div className={`text-xs flex items-center justify-end ${token.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                  {token.change24h >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {Math.abs(token.change24h).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WalletBalances;
