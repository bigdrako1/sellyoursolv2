import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Wallet, DollarSign, Percent, RefreshCw, Loader2 } from "lucide-react";
import { executeTrade, TradeParams } from "@/services/tradeService";
import { toast } from "sonner";
import { useCurrencyStore } from "@/store/currencyStore";

interface TradeExecutorProps {
  tokenSymbol: string;
  tokenAddress: string;
  tokenDecimals: number;
  currentPrice: number;
  onTradeComplete?: () => void;
}

const TradeExecutor: React.FC<TradeExecutorProps> = ({
  tokenSymbol,
  tokenAddress,
  tokenDecimals,
  currentPrice,
  onTradeComplete
}) => {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(1);
  const [useMarketOrder, setUseMarketOrder] = useState<boolean>(true);
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const { currencySymbol } = useCurrencyStore();
  
  // Update limit price when current price changes
  useEffect(() => {
    setLimitPrice(currentPrice.toString());
  }, [currentPrice]);
  
  // Calculate total value
  const calculateTotal = (): number => {
    const amountNum = parseFloat(amount) || 0;
    const priceNum = useMarketOrder ? currentPrice : (parseFloat(limitPrice) || 0);
    return amountNum * priceNum;
  };
  
  // Handle trade execution
  const handleExecuteTrade = async () => {
    try {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Invalid amount", {
          description: "Please enter a valid amount to trade."
        });
        return;
      }
      
      const priceToUse = useMarketOrder ? currentPrice : parseFloat(limitPrice);
      
      if (!useMarketOrder && (!limitPrice || parseFloat(limitPrice) <= 0)) {
        toast.error("Invalid price", {
          description: "Please enter a valid limit price."
        });
        return;
      }
      
      setIsExecuting(true);
      
      const tradeParams: TradeParams = {
        tokenSymbol,
        tokenAddress,
        tokenDecimals,
        amount: parseFloat(amount),
        price: priceToUse,
        type: tradeType,
        slippage: slippage
      };
      
      await executeTrade(tradeParams);
      
      // Reset form
      setAmount('');
      
      // Notify parent component
      if (onTradeComplete) {
        onTradeComplete();
      }
    } catch (error) {
      console.error("Trade execution error:", error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade {tokenSymbol}</span>
          <Badge variant="outline" className="bg-trading-darkAccent border-white/10">
            {currencySymbol}{currentPrice.toFixed(currentPrice < 0.01 ? 6 : 2)}
          </Badge>
        </CardTitle>
        <CardDescription>
          Execute trades directly within the app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" onValueChange={(value) => setTradeType(value as 'buy' | 'sell')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="buy" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Buy
            </TabsTrigger>
            <TabsTrigger value="sell" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Sell
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({tokenSymbol})</Label>
              <div className="flex space-x-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
                <Button 
                  variant="outline" 
                  className="bg-black/20 border-white/10"
                  onClick={() => setAmount((parseFloat(amount) || 0) + 1 + '')}
                >
                  +1
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="order-type">Market Order</Label>
              <Switch
                id="order-type"
                checked={useMarketOrder}
                onCheckedChange={setUseMarketOrder}
              />
            </div>
            
            {!useMarketOrder && (
              <div className="space-y-2">
                <Label htmlFor="limit-price">Limit Price ({currencySymbol})</Label>
                <Input
                  id="limit-price"
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="bg-black/20 border-white/10"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="slippage">Slippage Tolerance: {slippage}%</Label>
              </div>
              <Slider
                id="slippage"
                min={0.1}
                max={5}
                step={0.1}
                value={[slippage]}
                onValueChange={(value) => setSlippage(value[0])}
              />
            </div>
            
            <div className="bg-black/20 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price</span>
                <span>{currencySymbol}{(useMarketOrder ? currentPrice : parseFloat(limitPrice) || 0).toFixed(currentPrice < 0.01 ? 6 : 2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount</span>
                <span>{parseFloat(amount) || 0} {tokenSymbol}</span>
              </div>
              <div className="flex justify-between text-sm font-medium pt-2 border-t border-white/10">
                <span>Total</span>
                <span>{currencySymbol}{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <Button
              className={`w-full ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={handleExecuteTrade}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  {tradeType === 'buy' ? (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Buy {tokenSymbol}
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="mr-2 h-4 w-4" />
                      Sell {tokenSymbol}
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TradeExecutor;
