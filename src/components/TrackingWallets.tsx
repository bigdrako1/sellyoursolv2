
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  RefreshCw
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface TrackedWallet {
  id: number;
  address: string;
  alias: string;
  chain: "solana" | "binance";
  balance: number;
  activities: number;
  successRate: number;
  tracked: boolean;
}

interface WalletActivity {
  id: number;
  walletId: number;
  action: "Buy" | "Sell" | "Swap";
  token: string;
  amount: number;
  value: number;
  timestamp: string;
  profit: number;
}

const TrackingWallets = () => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletAlias, setNewWalletAlias] = useState("");
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  
  const addWallet = () => {
    if (newWalletAddress && newWalletAlias) {
      const newWallet: TrackedWallet = {
        id: wallets.length + 1,
        address: newWalletAddress,
        alias: newWalletAlias,
        chain: newWalletAddress.startsWith("0x") ? "binance" : "solana",
        balance: 0,
        activities: 0,
        successRate: 0,
        tracked: true
      };
      
      setWallets([newWallet, ...wallets]);
      setNewWalletAddress("");
      setNewWalletAlias("");
      setShowAddWallet(false);
    }
  };
  
  const toggleTracking = (id: number) => {
    setWallets(wallets.map(wallet => 
      wallet.id === id ? { ...wallet, tracked: !wallet.tracked } : wallet
    ));
  };
  
  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `$${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `$${(balance / 1000).toFixed(2)}K`;
    } else {
      return `$${balance.toFixed(2)}`;
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Tracked Wallets</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddWallet(!showAddWallet)}
              className="bg-trading-darkAccent border-white/10 hover:bg-white/10"
            >
              <Plus size={14} className="mr-1" /> Add Wallet
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-trading-darkAccent border-white/10 hover:bg-white/10"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
        
        {showAddWallet && (
          <div className="bg-black/20 rounded-lg p-3 mb-4 border border-white/10">
            <h4 className="text-sm font-medium mb-2">Add Wallet to Track</h4>
            <div className="space-y-3">
              <div>
                <Input 
                  placeholder="Wallet Address (SOL or BSC)" 
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
              </div>
              <div>
                <Input 
                  placeholder="Alias (Optional)" 
                  value={newWalletAlias}
                  onChange={(e) => setNewWalletAlias(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="trading-button w-full"
                  onClick={addWallet}
                >
                  Add to Tracking
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/10 hover:bg-white/10"
                  onClick={() => setShowAddWallet(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No wallets are being tracked yet</p>
              <p className="text-sm mt-1">Add a wallet to start tracking smart money movements</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAddWallet(true)}
                className="mt-4 bg-trading-darkAccent border-white/10 hover:bg-white/10"
              >
                <Plus size={14} className="mr-1" /> Add Wallet
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-white/5">
                        <th className="px-4 py-2 text-left">Wallet</th>
                        <th className="px-4 py-2 text-left">Chain</th>
                        <th className="px-4 py-2 text-right">Balance</th>
                        <th className="px-4 py-2 text-right">Activities</th>
                        <th className="px-4 py-2 text-right">Success Rate</th>
                        <th className="px-4 py-2 text-right">Status</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wallets.map((wallet) => (
                        <tr key={wallet.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Wallet size={14} className="text-trading-highlight" />
                              <div>
                                <div className="font-medium">{wallet.alias}</div>
                                <div className="text-xs text-gray-400">{wallet.address}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${wallet.chain === 'solana' ? 'bg-solana/20 text-white' : 'bg-binance/20 text-white'} border-none`}>
                              {wallet.chain === 'solana' ? 'Solana' : 'BSC'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatBalance(wallet.balance)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {wallet.activities}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className={`inline-flex items-center gap-1 ${
                              wallet.successRate > 80 ? 'text-trading-success' : 
                              wallet.successRate > 65 ? 'text-trading-warning' : 'text-trading-danger'
                            }`}>
                              {wallet.successRate}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant="outline" className={wallet.tracked ? 'bg-trading-success/20 text-trading-success' : 'bg-gray-800 text-gray-400'}>
                              {wallet.tracked ? 'Tracking' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal size={14} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-trading-darkAccent border-white/10">
                                <DropdownMenuItem onClick={() => toggleTracking(wallet.id)} className="cursor-pointer">
                                  <Eye size={14} className="mr-2" />
                                  {wallet.tracked ? 'Stop Tracking' : 'Start Tracking'}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer">
                                  <Copy size={14} className="mr-2" />
                                  Copy Address
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem className="text-trading-danger cursor-pointer">
                                  <Trash2 size={14} className="mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Wallet Activities</h4>
                {activities.length === 0 ? (
                  <div className="bg-black/20 p-4 rounded-lg text-center text-gray-400">
                    <p>No recent activities</p>
                    <p className="text-xs mt-1">Activities will appear here when detected</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const wallet = wallets.find(w => w.id === activity.walletId);
                      return (
                        <div key={activity.id} className="bg-black/20 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            {activity.action === "Buy" ? (
                              <ArrowUpRight className="h-4 w-4 text-trading-success" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-trading-danger" />
                            )}
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium">{activity.action} {activity.token}</span>
                                <span className="text-xs text-gray-400 ml-2">via {wallet?.alias}</span>
                              </div>
                              <div className="text-xs text-gray-400">{formatTime(activity.timestamp)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${activity.value.toFixed(2)}</div>
                            {activity.profit !== 0 && (
                              <div className={`text-xs ${activity.profit > 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                                {activity.profit > 0 ? '+' : ''}{activity.profit}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TrackingWallets;
