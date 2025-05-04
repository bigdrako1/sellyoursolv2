
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowUpRight, WalletIcon, ArrowDownRight, TrendingUp } from "lucide-react";
import { trackWalletActivities } from "@/services/tokenDataService";
import { fetchTokenMetadata } from "@/services/tokenDataService";
import { WalletActivity } from "@/types/database.types";

interface SmartMoneyAlertsProps {
  walletAddress?: string;
}

const SmartMoneyAlerts: React.FC<SmartMoneyAlertsProps> = ({ walletAddress }) => {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [trackedWallets, setTrackedWallets] = useState<string[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  
  useEffect(() => {
    if (walletAddress) {
      addWalletToTracking(walletAddress);
    }
  }, [walletAddress]);
  
  useEffect(() => {
    const loadTrackedWallets = () => {
      try {
        const saved = localStorage.getItem('tracked_wallets');
        if (saved) {
          return JSON.parse(saved);
        }
        return [];
      } catch (error) {
        console.error("Error loading tracked wallets:", error);
        return [];
      }
    };
    
    setTrackedWallets(loadTrackedWallets());
  }, []);
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (trackedWallets.length === 0) return;
      
      setLoading(true);
      try {
        const walletActivities = await trackWalletActivities(trackedWallets);
        setActivities(walletActivities);
      } catch (error) {
        console.error("Error fetching wallet activities:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
    
    // Refresh wallet activities every minute
    const intervalId = setInterval(fetchActivities, 60000);
    return () => clearInterval(intervalId);
  }, [trackedWallets]);
  
  const addWalletToTracking = (address: string) => {
    if (!address || trackedWallets.includes(address)) return;
    
    const updatedWallets = [...trackedWallets, address];
    setTrackedWallets(updatedWallets);
    localStorage.setItem('tracked_wallets', JSON.stringify(updatedWallets));
    
    // Clear input field
    setNewWalletAddress("");
  };
  
  const removeWalletFromTracking = (address: string) => {
    const updatedWallets = trackedWallets.filter(wallet => wallet !== address);
    setTrackedWallets(updatedWallets);
    localStorage.setItem('tracked_wallets', JSON.stringify(updatedWallets));
  };
  
  const handleAddWallet = () => {
    if (!newWalletAddress) return;
    addWalletToTracking(newWalletAddress);
  };
  
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(2);
  };
  
  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };
  
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  const handleViewOnDex = (tokenAddress: string) => {
    window.open(`https://birdeye.so/token/${tokenAddress}?chain=solana`, '_blank');
  };
  
  const handleViewOnExplorer = (hash: string) => {
    window.open(`https://solscan.io/tx/${hash}`, '_blank');
  };

  return (
    <Card className="card-with-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">Smart Money Movements</CardTitle>
        <Badge variant="outline" className="bg-trading-highlight/20 text-trading-highlight">
          {trackedWallets.length} {trackedWallets.length === 1 ? 'Wallet' : 'Wallets'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter wallet address"
            value={newWalletAddress}
            onChange={(e) => setNewWalletAddress(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddWallet} size="sm">
            Track
          </Button>
        </div>
        
        {trackedWallets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trackedWallets.map(wallet => (
              <Badge 
                key={wallet} 
                className="flex items-center gap-1 bg-trading-darkAccent"
                variant="secondary"
              >
                <WalletIcon className="h-3 w-3" />
                {truncateAddress(wallet)}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20 hover:text-red-500 rounded-full"
                  onClick={() => removeWalletFromTracking(wallet)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
            <p className="text-sm text-gray-400">Fetching smart money movements...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            {trackedWallets.length === 0 
              ? "No wallets being tracked. Add a wallet to monitor smart money movements." 
              : "No recent activity detected for tracked wallets."}
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Alert 
                key={activity.id} 
                className={`bg-trading-darkAccent border-l-4 ${
                  activity.activityType === 'buy' ? 'border-l-green-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <AlertTitle className="flex items-center font-bold">
                      {activity.tokenName} ({activity.tokenSymbol})
                      <Badge 
                        className={`ml-2 ${
                          activity.activityType === 'buy' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {activity.activityType === 'buy' ? 'BUY' : 'SELL'}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      Value: ${activity.value?.toLocaleString()} | Amount: {formatAmount(activity.amount || 0)}
                    </AlertDescription>
                    <div className="flex items-center mt-1 text-xs text-gray-400">
                      <span className="mr-1">Wallet: {truncateAddress(activity.walletAddress)}</span>
                      <span className="mx-2">•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {activity.activityType === 'buy' ? (
                      <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Accumulating
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/20">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        Selling
                      </Badge>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleViewOnDex(activity.tokenAddress || '')}
                        className="text-xs flex items-center text-blue-400 hover:underline"
                      >
                        Chart <ArrowUpRight className="h-3 w-3 ml-1" />
                      </button>
                      <button
                        onClick={() => handleViewOnExplorer(activity.transactionHash)}
                        className="text-xs flex items-center text-gray-400 hover:underline"
                      >
                        Tx <ArrowUpRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartMoneyAlerts;
