import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, X } from "lucide-react";
import { getPositions, closePosition, updatePositionPrices, TradePosition } from "@/services/tradeService";
import { toast } from "sonner";
import { useCurrencyStore } from "@/store/currencyStore";

interface ActivePositionsProps {
  refreshInterval?: number; // in milliseconds
  onPositionClose?: () => void;
}

const ActivePositions: React.FC<ActivePositionsProps> = ({
  refreshInterval = 30000, // Default to 30 seconds
  onPositionClose
}) => {
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<Record<string, boolean>>({});
  const { currencySymbol } = useCurrencyStore();
  
  // Load positions
  const loadPositions = async () => {
    try {
      await updatePositionPrices();
      const currentPositions = getPositions();
      setPositions(currentPositions);
    } catch (error) {
      console.error("Error loading positions:", error);
    }
  };
  
  // Initial load and refresh interval
  useEffect(() => {
    setIsLoading(true);
    loadPositions().finally(() => setIsLoading(false));
    
    const intervalId = setInterval(() => {
      loadPositions();
    }, refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadPositions();
      toast.success("Positions refreshed", {
        description: "Latest position data has been loaded."
      });
    } catch (error) {
      toast.error("Refresh failed", {
        description: "Could not refresh positions. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle position close
  const handleClosePosition = async (tokenAddress: string) => {
    setIsClosing(prev => ({ ...prev, [tokenAddress]: true }));
    try {
      const result = await closePosition(tokenAddress);
      
      if (result) {
        toast.success("Position closed", {
          description: `Successfully closed position for ${result.tokenSymbol}.`
        });
        
        // Refresh positions
        await loadPositions();
        
        // Notify parent component
        if (onPositionClose) {
          onPositionClose();
        }
      }
    } catch (error) {
      console.error("Error closing position:", error);
      toast.error("Failed to close position", {
        description: "An error occurred while closing the position. Please try again."
      });
    } finally {
      setIsClosing(prev => ({ ...prev, [tokenAddress]: false }));
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>
            Your current open trading positions
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="bg-black/20 border-white/10"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {positions.length > 0 ? (
          <div className="space-y-3">
            {positions.map((position) => (
              <div
                key={position.tokenAddress}
                className="bg-black/20 p-3 rounded-lg border border-white/5"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-900/20 text-purple-300 border-purple-500/20">
                      {position.tokenSymbol}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      {position.amount.toFixed(position.amount < 1 ? 4 : 2)} tokens
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-white"
                    onClick={() => handleClosePosition(position.tokenAddress)}
                    disabled={isClosing[position.tokenAddress]}
                  >
                    {isClosing[position.tokenAddress] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div>
                    <div className="text-gray-400">Entry Price</div>
                    <div>{currencySymbol}{position.entryPrice.toFixed(position.entryPrice < 0.01 ? 6 : 2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Current Price</div>
                    <div>{currencySymbol}{position.currentPrice.toFixed(position.currentPrice < 0.01 ? 6 : 2)}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <div className="text-sm">
                    <span className="text-gray-400 mr-2">P/L:</span>
                    <span className={position.profitLoss >= 0 ? "text-green-500" : "text-red-500"}>
                      {position.profitLoss >= 0 ? "+" : ""}{currencySymbol}{Math.abs(position.profitLoss).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {position.profitLossPercentage >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={position.profitLossPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                      {position.profitLossPercentage >= 0 ? "+" : ""}{position.profitLossPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <div className="mb-2">No active positions</div>
            <div className="text-sm">Your open positions will appear here</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivePositions;
