
import { useEffect, useState } from "react";
import { getWalletBalances, WalletData, TokenData } from "@/utils/walletUtils";
import { ChevronUp, ChevronDown, Wallet } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { heliusRpcCall } from "@/utils/apiUtils";
import { parseHeliusWalletBalance, HeliusWalletBalance } from "@/utils/heliusTypes";
import { useToast } from "@/hooks/use-toast";

const WalletBalances = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { currency, currencySymbol } = useCurrencyStore();
  const { toast } = useToast();
  
  // Track mounted state to prevent state updates after unmount
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    const loadWalletData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setHasError(false);
      
      try {
        const connectedAddress = localStorage.getItem('walletAddress');
        if (connectedAddress) {
          // Get wallet token balances from Helius API
          try {
            const balanceResponse = await heliusRpcCall("getTokenBalances", [connectedAddress]);
            
            if (!isMounted) return;
            
            if (balanceResponse) {
              const parsedBalanceResponse = parseHeliusWalletBalance(balanceResponse);
              
              if (!isMounted) return;
              
              if (parsedBalanceResponse) {
                // Process the balance data
                const nativeBalance = parsedBalanceResponse.nativeBalance || 0;
                
                // Process token balances
                const processedTokens: TokenData[] = [];
                
                if (parsedBalanceResponse.tokens && Array.isArray(parsedBalanceResponse.tokens)) {
                  const tokenPromises = parsedBalanceResponse.tokens.map(async (token) => {
                    if (!token.mint || !token.amount) return null;
                    
                    try {
                      // Mock price data since API might be unreliable
                      const price = Math.random() * 0.01; // Random price for demo
                      const balance = token.amount / Math.pow(10, token.decimals || 9);
                      const usdValue = balance * price;
                      
                      return {
                        symbol: token.symbol || token.tokenSymbol || token.mint.substring(0, 4),
                        balance,
                        usdValue,
                        price,
                        change24h: Math.random() * 10 - 5, // Mock 24h change
                        logo: token.logo
                      };
                    } catch (priceError) {
                      console.error("Failed to get token price:", priceError);
                      return null;
                    }
                  });
                  
                  const resolvedTokens = await Promise.all(tokenPromises);
                  if (!isMounted) return;
                  
                  // Filter out null values and add to processed tokens
                  resolvedTokens.forEach(token => {
                    if (token) processedTokens.push(token);
                  });
                }
                
                // Calculate total USD value
                const solPrice = 100; // Mock SOL price ($100)
                const solValue = nativeBalance * solPrice;
                const tokenTotalValue = processedTokens.reduce((sum, token) => sum + token.usdValue, 0);
                const totalUsdValue = solValue + tokenTotalValue;
                
                if (!isMounted) return;
                
                setWalletData({
                  address: connectedAddress,
                  balance: nativeBalance,
                  tokens: processedTokens,
                  totalUsdValue
                });
              } else {
                throw new Error("Invalid response format");
              }
            } else {
              throw new Error("No balance data returned");
            }
          } catch (apiError) {
            console.error("API error fetching wallet data:", apiError);
            
            if (!isMounted) return;
            
            // Fall back to mock data from walletUtils
            const data = await getWalletBalances(connectedAddress);
            setWalletData(data);
          }
        }
      } catch (error) {
        console.error("Failed to load wallet data", error);
        
        if (!isMounted) return;
        
        setHasError(true);
        
        toast({
          title: "Failed to Load Wallet Data",
          description: "Unable to fetch your wallet balances. Using cached data if available.",
          variant: "destructive",
        });
        
        // Try to recover with mock data
        try {
          const connectedAddress = localStorage.getItem('walletAddress');
          if (connectedAddress) {
            const mockData = await getWalletBalances(connectedAddress);
            setWalletData(mockData);
          }
        } catch (mockError) {
          // If even mock data fails, we'll show the no wallet state
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadWalletData();
    
    // Set up retry mechanism
    if (hasError) {
      const retryTimer = setTimeout(() => {
        if (isMounted) {
          setRetryCount(prev => prev + 1);
        }
      }, 30000); // Retry after 30 seconds on error
      
      return () => clearTimeout(retryTimer);
    }
  }, [toast, retryCount, isMounted]);

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
        
        {hasError && (
          <div className="flex items-center gap-1 mt-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-yellow-500">Using cached data</span>
          </div>
        )}
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
