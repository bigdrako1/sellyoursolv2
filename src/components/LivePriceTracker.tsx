
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { heliusApiCall } from "@/utils/apiUtils";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  lastPrice?: number;
  priceChangeTimestamp?: number;
}

const LivePriceTracker = () => {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: "SOL", price: 0, change24h: 0 }
  ]);
  const { toast } = useToast();
  const fetchTimerRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialPrices = async () => {
      setIsLoading(true);
      try {
        const response = await heliusApiCall<any>('/token-prices', 'GET');
        
        if (response && response.tokens) {
          const solData = response.tokens.find((token: any) => 
            token.symbol.toLowerCase() === "sol" || token.name.toLowerCase() === "solana");
          
          const initialPrices: PriceData[] = [];
          
          if (solData) {
            initialPrices.push({
              symbol: "SOL",
              price: parseFloat(solData.price) || 0,
              change24h: parseFloat(solData.change24h) || 0
            });
          } else {
            initialPrices.push({ symbol: "SOL", price: 0, change24h: 0 });
          }
          
          setPrices(initialPrices);
        }
        setIsLoading(false);
        startPriceFetching();
      } catch (error) {
        console.error("Failed to fetch initial prices:", error);
        // Fallback to default values
        setPrices([
          { symbol: "SOL", price: 140, change24h: 0 }
        ]);
        setIsLoading(false);
        startPriceFetching();
      }
    };

    fetchInitialPrices();

    return () => {
      if (fetchTimerRef.current !== null) {
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []);

  const startPriceFetching = () => {
    const updatePrices = async () => {
      try {
        const response = await heliusApiCall<any>('/token-prices', 'GET');
        
        if (response && response.tokens) {
          setPrices(currentPrices => {
            return currentPrices.map(token => {
              const lastPrice = token.price;
              
              // Find the matching token in the API response
              const tokenData = response.tokens.find((t: any) => 
                t.symbol.toLowerCase() === token.symbol.toLowerCase() ||
                (token.symbol === "SOL" && t.name.toLowerCase() === "solana")
              );
              
              if (!tokenData) return token;
              
              const newPrice = parseFloat(tokenData.price) || lastPrice;
              const change24h = parseFloat(tokenData.change24h) || 0;
              
              // Check for significant price changes (>2%)
              const significantChange = lastPrice && Math.abs((newPrice - lastPrice) / lastPrice) > 0.02;
              const currentTime = Date.now();
              const hasTimeElapsed = !token.priceChangeTimestamp || 
                (currentTime - token.priceChangeTimestamp > 5000); // 5 seconds cooldown
              
              // Show toast for very significant price changes (>2%)
              if (significantChange && hasTimeElapsed) {
                toast({
                  title: `${token.symbol} ${newPrice > lastPrice ? 'Rising' : 'Dropping'}`,
                  description: `${newPrice > lastPrice ? '+' : '-'}${Math.abs((newPrice - lastPrice) / lastPrice * 100).toFixed(2)}% in the last update`,
                  variant: newPrice > lastPrice ? "default" : "destructive",
                });
              }
              
              return {
                ...token,
                lastPrice,
                price: newPrice,
                change24h: change24h,
                priceChangeTimestamp: significantChange && hasTimeElapsed ? currentTime : token.priceChangeTimestamp
              };
            });
          });
        }
        
        // Schedule next update with a slight randomization to make it feel more natural
        const nextUpdateDelay = 10000 + (Math.random() * 2000);
        fetchTimerRef.current = window.setTimeout(updatePrices, nextUpdateDelay);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
        // Retry on failure after a delay
        fetchTimerRef.current = window.setTimeout(updatePrices, 15000);
      }
    };

    // Initial fetch schedule
    fetchTimerRef.current = window.setTimeout(updatePrices, 10000);
  };

  const getPriceChangeClass = (token: PriceData) => {
    if (!token.lastPrice) return '';
    
    const currentTime = Date.now();
    const hasRecentChange = token.priceChangeTimestamp && 
      (currentTime - token.priceChangeTimestamp < 2000); // Animation lasts 2 seconds max
    
    if (!hasRecentChange) return '';
    
    return token.price > token.lastPrice 
      ? 'animate-pulse border-trading-success/20' 
      : 'animate-pulse border-trading-danger/20';
  };

  if (isLoading) {
    return (
      <div className="flex gap-2">
        <Card className="px-3 py-1 bg-trading-darkAccent border-white/5 opacity-50">
          <div className="flex items-center gap-1">
            <span className="font-medium text-xs">SOL: Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {prices.map((price) => (
        <Card 
          key={price.symbol}
          className={`
            px-3 py-1 flex items-center gap-1 bg-trading-darkAccent border-white/5
            ${getPriceChangeClass(price)}
          `}
        >
          <span className="font-medium text-xs">{price.symbol}:</span>
          <span className="text-xs">${price.price.toFixed(2)}</span>
          <span className={`text-xs flex items-center ${price.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
            {price.change24h >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(price.change24h).toFixed(1)}%
          </span>
        </Card>
      ))}
    </div>
  );
};

export default LivePriceTracker;
