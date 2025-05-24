import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp,
  TrendingDown,
  Check,
  Loader2,
  Settings,
  DollarSign,
  Clock,
  Zap,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { executeTrade, createTradingPosition } from '@/utils/tradingUtils';
import { getTokenPrice } from '@/utils/marketUtils';

interface Token {
  symbol: string;
  name: string;
  address?: string;
  price?: number;
  change24h?: number;
  volume?: number;
  liquidity?: number;
}

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
  defaultAction?: 'buy' | 'sell';
}

const TradingModal: React.FC<TradingModalProps> = ({
  isOpen,
  onClose,
  token,
  defaultAction = 'buy'
}) => {
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>(defaultAction);
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [slippage, setSlippage] = useState(1.0);
  const [priorityFee, setPriorityFee] = useState(0.0001);
  const [trackPosition, setTrackPosition] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState<number | null>(null);

  // Load current price when token changes
  useEffect(() => {
    if (token && isOpen) {
      loadTokenPrice();
    }
  }, [token, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTradeAmount(0.1);
      setSlippage(1.0);
      setPriorityFee(0.0001);
      setTrackPosition(true);
      setIsProcessing(false);
      setCurrentPrice(null);
      setPriceLoading(false);
      setEstimatedOutput(null);
      setTradeAction(defaultAction);
    }
  }, [isOpen, defaultAction]);

  // Calculate estimated output when amount or price changes
  useEffect(() => {
    if (currentPrice && tradeAmount > 0) {
      if (tradeAction === 'buy') {
        setEstimatedOutput(tradeAmount / currentPrice);
      } else {
        setEstimatedOutput(tradeAmount * currentPrice);
      }
    } else {
      setEstimatedOutput(null);
    }
  }, [currentPrice, tradeAmount, tradeAction]);

  const loadTokenPrice = async () => {
    if (!token?.address) return;

    setPriceLoading(true);
    try {
      const price = await getTokenPrice(token.address);
      setCurrentPrice(price || token.price || 0);
    } catch (error) {
      console.error('Error loading token price:', error);
      setCurrentPrice(token.price || 0);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!token?.address) return;

    setIsProcessing(true);

    try {
      // Execute the trade using our internal trading function
      const result = await executeTrade(token.address, tradeAmount);

      if (result.success) {
        // If tracking is enabled, create a position to track
        if (trackPosition && tradeAction === 'buy') {
          const position = createTradingPosition(
            token.address,
            token.name,
            token.symbol,
            currentPrice || 0,
            tradeAmount * (currentPrice || 0), // Convert to USD value
            "Token List Trade"
          );

          console.log("Created position:", position);
        }

        toast.success(
          `Successfully ${tradeAction === 'buy' ? 'bought' : 'sold'} ${token.symbol}`,
          {
            description: `${tradeAction === 'buy' ? 'Spent' : 'Received'} ${tradeAmount} SOL`
          }
        );

        onClose();
      } else {
        toast.error("Trade failed", {
          description: result.error || "Please try again later"
        });
      }
    } catch (error) {
      console.error("Trade execution error:", error);
      toast.error("Trade failed", {
        description: "An unexpected error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getEstimatedValue = () => {
    if (!currentPrice || !tradeAmount) return 0;
    return tradeAction === 'buy' ? tradeAmount * currentPrice : tradeAmount / currentPrice;
  };

  if (!token) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-trading-darkAccent border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 h-10 w-10 rounded-full flex items-center justify-center font-bold border border-purple-500/20">
              {token.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="text-xl font-bold">Trade {token.symbol}</div>
              <div className="text-sm text-gray-400">{token.name}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trade Action Selector */}
          <Tabs value={tradeAction} onValueChange={(value) => setTradeAction(value as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2 bg-black/20">
              <TabsTrigger value="buy" className="data-[state=active]:bg-green-600">
                <TrendingUp className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
                <TrendingDown className="h-4 w-4 mr-2" />
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Token Info */}
          <div className="bg-black/20 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current Price</span>
              <div className="flex items-center gap-2">
                {priceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-white font-medium">
                    ${currentPrice?.toFixed(8) || '0.00000000'}
                  </span>
                )}
              </div>
            </div>

            {token.change24h !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Change</span>
                <span className={`font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                </span>
              </div>
            )}

            {token.volume && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white">{formatCurrency(token.volume)}</span>
              </div>
            )}
          </div>

          {/* Trade Amount */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-white">
              {tradeAction === 'buy' ? 'Amount to Spend (SOL)' : 'Amount to Sell (Tokens)'}
            </Label>
            <Input
              id="amount"
              type="number"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
              className="bg-black/20 border-white/10 text-white"
              min={0.01}
              step={0.01}
            />
            <Slider
              value={[tradeAmount]}
              min={0.01}
              max={tradeAction === 'buy' ? 5 : 1000}
              step={0.01}
              onValueChange={(value) => setTradeAmount(value[0])}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0.01</span>
              <span>{tradeAction === 'buy' ? '2.5' : '500'}</span>
              <span>{tradeAction === 'buy' ? '5.0' : '1000'}</span>
            </div>
          </div>

          {/* Estimated Output */}
          {estimatedOutput && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-300">Estimated {tradeAction === 'buy' ? 'Tokens' : 'SOL'}</span>
                <span className="text-white font-medium">
                  {estimatedOutput.toFixed(tradeAction === 'buy' ? 6 : 8)}
                </span>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-400" />
              <span className="text-white font-medium">Advanced Settings</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slippage" className="text-white">Slippage (%)</Label>
                <Input
                  id="slippage"
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 1.0)}
                  className="bg-black/20 border-white/10 text-white"
                  min={0.1}
                  max={50}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priorityFee" className="text-white">Priority Fee (SOL)</Label>
                <Input
                  id="priorityFee"
                  type="number"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(parseFloat(e.target.value) || 0.0001)}
                  className="bg-black/20 border-white/10 text-white"
                  min={0.0001}
                  step={0.0001}
                />
              </div>
            </div>

            {tradeAction === 'buy' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <Label htmlFor="trackPosition" className="text-white cursor-pointer">
                    Track position in portfolio
                  </Label>
                </div>
                <Switch
                  id="trackPosition"
                  checked={trackPosition}
                  onCheckedChange={setTrackPosition}
                />
              </div>
            )}
          </div>

          {/* Trade Summary */}
          <div className="bg-trading-highlight/10 border border-trading-highlight/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-trading-highlight" />
              <span className="text-trading-highlight font-medium">Trade Summary</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Action:</span>
                <span className="text-white">{tradeAction === 'buy' ? 'Buy' : 'Sell'} {token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white">{tradeAmount} {tradeAction === 'buy' ? 'SOL' : token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage:</span>
                <span className="text-white">{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Est. Fee:</span>
                <span className="text-white">{(tradeAmount * 0.001).toFixed(6)} SOL</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">
                This trade will be executed using our internal DEX aggregator for optimal routing and pricing.
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="bg-black/20 border-white/10 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button
            onClick={handleExecuteTrade}
            disabled={isProcessing || !tradeAmount || !currentPrice}
            className={`${tradeAction === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {tradeAction === 'buy' ? 'Buy' : 'Sell'} {token.symbol}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradingModal;
