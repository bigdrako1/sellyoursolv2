
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, TrendingUp, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { executeTrade, createTradingPosition } from "@/utils/tradingUtils";

interface TradeAlert {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  type: string;
  detail: string;
  timestamp: string;
  price?: number;
}

// Sample trade alerts
const SAMPLE_ALERTS: TradeAlert[] = [
  {
    id: "1",
    tokenName: "Alpha Runner",
    tokenSymbol: "ALPHA",
    tokenAddress: "5qTnnb9UCVzpEErQNgcwi5seVjKc8kizNnWcmgxQt3Us",
    type: "price_gain",
    detail: "increased by 25% in the last hour",
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    price: 0.00024
  },
  {
    id: "2",
    tokenName: "Gamma Coin",
    tokenSymbol: "GAMMA",
    tokenAddress: "5G811VMkkTKU4HTFQZURp5jcfZbD4LF2SGym5qQbviFN",
    type: "quality_token",
    detail: "trending on Jupiter with high quality score",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    price: 0.00341
  }
];

const TradeAlerts: React.FC = () => {
  const [alerts] = useState<TradeAlert[]>(SAMPLE_ALERTS);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TradeAlert | null>(null);
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trackPosition, setTrackPosition] = useState(true);

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case "price_gain":
        return <Badge className="bg-green-600">Price Up</Badge>;
      case "price_drop":
        return <Badge className="bg-red-600">Price Down</Badge>;
      case "quality_token":
        return <Badge className="bg-blue-600">Quality Token</Badge>;
      case "whale_activity":
        return <Badge className="bg-purple-600">Whale Activity</Badge>;
      default:
        return <Badge>Alert</Badge>;
    }
  };

  const handleTradeClick = (alert: TradeAlert) => {
    setSelectedToken(alert);
    setTradeDialogOpen(true);
  };

  const handleExecuteTrade = async () => {
    if (!selectedToken) return;

    setIsProcessing(true);

    try {
      // Execute the trade using our internal trading function
      const result = await executeTrade(selectedToken.tokenAddress, tradeAmount);

      if (result.success) {
        // If tracking is enabled, create a position to track
        if (trackPosition) {
          const position = createTradingPosition(
            selectedToken.tokenAddress,
            selectedToken.tokenName,
            selectedToken.tokenSymbol,
            selectedToken.price || 0,
            tradeAmount * 100, // Convert to USD for demo
            "Alert Signal"
          );

          console.log("Created position:", position);
        }

        toast.success(`Successfully traded ${tradeAmount} SOL for ${selectedToken.tokenSymbol}`, {
          description: "Transaction completed successfully"
        });
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
      setTradeDialogOpen(false);
    }
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Trade Alerts
          </div>
          {alerts.length > 0 && <Badge className="bg-amber-600">{alerts.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <div key={alert.id} className="bg-black/20 p-2 rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    {getAlertBadge(alert.type)}
                    <span className="ml-2 font-medium">${alert.tokenSymbol}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(alert.timestamp)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  {alert.tokenName} {alert.detail}
                </div>
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    className="text-xs h-7 flex-grow"
                    onClick={() => handleTradeClick(alert)}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trade
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-black/20 border-white/10 h-7 w-7"
                    onClick={() => window.open(`https://birdeye.so/token/${alert.tokenAddress}?chain=solana`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              No alerts at this time
            </div>
          )}
        </div>
      </CardContent>

      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              Trade {selectedToken?.tokenSymbol}
            </DialogTitle>
          </DialogHeader>

          {selectedToken && (
            <div className="space-y-4">
              <div className="bg-black/20 p-3 rounded-md">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Token:</span>
                  <span>{selectedToken.tokenName} (${selectedToken.tokenSymbol})</span>
                </div>
                {selectedToken.price && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">Price:</span>
                    <span>${selectedToken.price.toFixed(8)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Signal Type:</span>
                  <span>{selectedToken.type.replace('_', ' ')}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Amount (SOL)</Label>
                <div className="mt-1">
                  <Input
                    id="amount"
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                    className="bg-black/20 border-white/10"
                    min={0.01}
                    step={0.01}
                  />
                </div>
                <Slider
                  value={[tradeAmount]}
                  min={0.01}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => setTradeAmount(value[0])}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0.01</span>
                  <span>0.25</span>
                  <span>0.5</span>
                  <span>1.0</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="trackPosition" className="cursor-pointer">Track position in portfolio</Label>
                <input
                  id="trackPosition"
                  type="checkbox"
                  checked={trackPosition}
                  onChange={(e) => setTrackPosition(e.target.checked)}
                  className="form-checkbox h-4 w-4"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-3">
                <p className="text-xs text-blue-300">
                  This trade will be executed directly within the app using our optimal routing algorithm.
                  {trackPosition && " Your position will be tracked in your portfolio."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExecuteTrade}
              disabled={isProcessing || !tradeAmount}
              className="relative"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Execute Trade
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TradeAlerts;
