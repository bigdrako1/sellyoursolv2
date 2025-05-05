
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ExternalLink, Bell } from "lucide-react";
import { toast } from "sonner";

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
  
  const handleFollow = (alertId: string) => {
    toast(`Alert ${alertId} followed. You'll be notified of similar activity in the future`);
  };
  
  const handleTrade = (tokenAddress: string, tokenSymbol: string) => {
    toast(`Opening trading modal for ${tokenSymbol}`);
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
              {alerts.map(alert => (
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
                      onClick={() => handleTrade(alert.tokenAddress, alert.tokenSymbol)}
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
    </Card>
  );
};

export default SmartMoneyAlerts;
