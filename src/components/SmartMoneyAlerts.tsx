
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface SmartMoneyAlert {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAddress: string;
  walletAddress: string;
  walletName: string;
  actionType: string;
  amount: number;
  timestamp: string;
}

// Sample data for smart money alerts
const SAMPLE_ALERTS: SmartMoneyAlert[] = [
  {
    id: "alert1",
    tokenName: "MEME1000",
    tokenSymbol: "MEME",
    tokenAddress: "5qTnnb9UCVzpEErQNgcwi5seVjKc8kizNnWcmgxQt3Us",
    walletAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    walletName: "Smart Trader 1",
    actionType: "buy",
    amount: 20000,
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: "alert2",
    tokenName: "Doggo Finance",
    tokenSymbol: "DOGGO",
    tokenAddress: "A9UhP3N9FL1CAS9TEJvQjGYPaY9fuCYjyFSoebpLMvCX",
    walletAddress: "DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU",
    walletName: "SOL Whale",
    actionType: "buy",
    amount: 50000,
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },
  {
    id: "alert3",
    tokenName: "Alpha Runner",
    tokenSymbol: "ALPHA",
    tokenAddress: "5qTnnb9UCVzpEErQNgcwi5seVjKc8kizNnWcmgxQt3Us",
    walletAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    walletName: "Smart Trader 1",
    actionType: "sell",
    amount: 5000,
    timestamp: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
  }
];

const SmartMoneyAlerts: React.FC = () => {
  const [alerts] = useState<SmartMoneyAlert[]>(SAMPLE_ALERTS);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<SmartMoneyAlert | null>(null);
  const [tradeAmount, setTradeAmount] = useState(0.1);
  
  const handleFollow = (alertId: string) => {
    toast(`Alert ${alertId} followed. You'll be notified of similar activity in the future`);
  };
  
  const handleTrade = (alert: SmartMoneyAlert) => {
    setSelectedToken(alert);
    setTradeDialogOpen(true);
  };
  
  const handleExecuteTrade = () => {
    if (!selectedToken) return;
    
    toast(`Executed trade for ${tradeAmount} SOL of ${selectedToken.tokenSymbol}`, {
      description: "Transaction submitted successfully"
    });
    
    setTradeDialogOpen(false);
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return `${diffMins}m ago`;
    }
  };
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            Smart Money Alerts
          </div>
          <Badge className="bg-blue-600">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="bg-black/20 p-3 rounded-lg border border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className={alert.actionType === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                        {alert.actionType === 'buy' ? 'BUY' : 'SELL'}
                      </Badge>
                      <span className="ml-2 font-medium">${alert.tokenSymbol}</span>
                      <span className="ml-1 text-gray-400">{alert.tokenName}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet:</span>
                      <span className="font-mono">{alert.walletName || truncateAddress(alert.walletAddress)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400">Amount:</span>
                      <span>${alert.amount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/20 border-white/10 text-xs h-7 flex-1"
                      onClick={() => handleTrade(alert)}
                    >
                      Trade
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-black/20 border-white/10 text-xs h-7 flex-1"
                      onClick={() => handleFollow(alert.id)}
                    >
                      <Bell className="h-3 w-3 mr-1" />
                      Follow
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="bg-black/20 border-white/10 h-7 w-7"
                      onClick={() => window.open(`https://solscan.io/tx/${alert.id}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No smart money alerts yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Alerts will appear when tracked wallets make significant trades
              </p>
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
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Signal Type:</span>
                  <span className="capitalize">{selectedToken.actionType}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Smart Money:</span>
                  <span>{selectedToken.walletName}</span>
                </div>
              </div>
              
              <div>
                <Label className="block">Amount (SOL)</Label>
                <div className="mt-1">
                  <Input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0.01)}
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
              
              <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-3">
                <p className="text-xs text-blue-300">
                  Following smart money's {selectedToken.actionType} signal for ${selectedToken.tokenSymbol}.
                  This trade will be executed using our optimal routing algorithm.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecuteTrade}>
              Execute Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SmartMoneyAlerts;
