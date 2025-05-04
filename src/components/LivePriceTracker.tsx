
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { playSound, initAudio } from "@/utils/soundUtils";
import { useToast } from "@/hooks/use-toast";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  lastPrice?: number;
}

const LivePriceTracker = () => {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: "SOL", price: 0, change24h: 0 },
    { symbol: "BNB", price: 0, change24h: 0 }
  ]);
  const { toast } = useToast();
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio on component mount or user interaction
  useEffect(() => {
    const initAudioContext = () => {
      initAudio();
      setAudioInitialized(true);
      // Remove event listeners after initialization
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
    
    // Add event listeners for user interaction to initialize audio
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
    
    return () => {
      // Clean up listeners
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // Simulate price updates - In production, this would fetch from a real API
        const newPrices = prices.map(token => {
          const lastPrice = token.price;
          const newPrice = token.symbol === "SOL" 
            ? 140 + Math.random() * 5 
            : 580 + Math.random() * 10;
          
          // Play sound on significant price changes (>1%) only if audio is initialized
          if (lastPrice && Math.abs((newPrice - lastPrice) / lastPrice) > 0.01 && audioInitialized) {
            playSound(newPrice > lastPrice ? 'success' : 'alert');
            
            // Show toast for significant price changes
            if (Math.abs((newPrice - lastPrice) / lastPrice) > 0.02) {
              toast({
                title: `${token.symbol} ${newPrice > lastPrice ? 'Rising' : 'Dropping'}`,
                description: `${newPrice > lastPrice ? '+' : '-'}${Math.abs((newPrice - lastPrice) / lastPrice * 100).toFixed(2)}% in the last update`,
                variant: newPrice > lastPrice ? "default" : "destructive",
              });
            }
          }
          
          return {
            ...token,
            lastPrice: token.price,
            price: newPrice,
            change24h: -2.5 + Math.random() * 5
          };
        });
        
        setPrices(newPrices);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      }
    };

    // Initial fetch
    fetchPrices();
    
    // Update every 10 seconds
    const interval = setInterval(fetchPrices, 10000);

    return () => clearInterval(interval);
  }, [prices, audioInitialized]);

  return (
    <div className="flex gap-2">
      {prices.map((price) => (
        <Card 
          key={price.symbol}
          className={`
            px-3 py-2 flex items-center gap-2 bg-trading-darkAccent border-white/5
            ${price.lastPrice && price.price > price.lastPrice ? 'animate-pulse border-trading-success/20' : ''}
            ${price.lastPrice && price.price < price.lastPrice ? 'animate-pulse border-trading-danger/20' : ''}
          `}
        >
          <span className="font-medium text-sm">{price.symbol}</span>
          <span className="text-sm">${price.price.toFixed(2)}</span>
          <span className={`text-xs flex items-center ${price.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
            {price.change24h >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(price.change24h).toFixed(2)}%
          </span>
        </Card>
      ))}
    </div>
  );
};

export default LivePriceTracker;
