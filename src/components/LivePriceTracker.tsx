
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

const LivePriceTracker = () => {
  const [prices, setPrices] = useState<PriceData[]>([
    { symbol: "SOL", price: 0, change24h: 0 },
    { symbol: "BNB", price: 0, change24h: 0 }
  ]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        // In a real app, this would fetch from a price API
        const mockPrices = [
          { symbol: "SOL", price: 140 + Math.random() * 5, change24h: -2.5 + Math.random() * 5 },
          { symbol: "BNB", price: 580 + Math.random() * 10, change24h: 1.2 + Math.random() * 3 }
        ];
        setPrices(mockPrices);
      } catch (error) {
        console.error("Failed to fetch prices:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-2">
      {prices.map((price) => (
        <Card key={price.symbol} className="px-3 py-2 flex items-center gap-2 bg-trading-darkAccent border-white/5">
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
