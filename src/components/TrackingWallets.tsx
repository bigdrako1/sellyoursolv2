
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

// Sample tracked wallets data
const walletData = [
  { id: 1, address: "8xHf6...3Zdy7", alias: "Whale-1", chain: "solana", balance: 3214890, activities: 128, successRate: 89, tracked: true },
  { id: 2, address: "0x4d7...9F3e", alias: "Degen Alpha", chain: "binance", balance: 983456, activities: 79, successRate: 72, tracked: true },
  { id: 3, address: "8hTvR...7Kpq2", alias: "SOL Trader", chain: "solana", balance: 561234, activities: 92, successRate: 81, tracked: true },
  { id: 4, address: "0x7b8...5F2d", alias: "BSC Sniper", chain: "binance", balance: 124567, activities: 43, successRate: 65, tracked: false },
  { id: 5, address: "8pLm3...1Gxn9", alias: "MEV Master", chain: "solana", balance: 789012, activities: 156, successRate: 91, tracked: true },
];

// Sample wallet activities
const walletActivities = [
  { id: 1, walletId: 1, action: "Buy", token: "SRUN", amount: 3245, value: 7943.25, timestamp: "2024-04-19T10:15:22Z", profit: 12.3 },
  { id: 2, walletId: 3, action: "Sell", token: "JUP", amount: 1500, value: 1860.00, timestamp: "2024-04-19T09:47:18Z", profit: -1.8 },
  { id: 3, walletId: 5, action: "Buy", token: "AUTO", amount: 8700, value: 6482.40, timestamp: "2024-04-19T08:32:40Z", profit: 7.5 },
  { id: 4, walletId: 2, action: "Buy", token: "FBOT", amount: 245, value: 296.45, timestamp: "2024-04-19T08:15:33Z", profit: 3.1 },
  { id: 5, walletId: 1, action: "Swap", token: "SOL → TDX", amount: 12, value: 1680.00, timestamp: "2024-04-19T07:22:09Z", profit: 0 },
];

const TrackingWallets = () => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletAlias, setNewWalletAlias] = useState("");
  const [wallets, setWallets] = useState(walletData);
  const [activities, setActivities] = useState(walletActivities);
  
  const addWallet = () => {
    if (newWalletAddress && newWalletAlias) {
      const newWallet = {
        id: wallets.length + 1,
        address: newWalletAddress,
        alias: newWalletAlias,
        chain: newWalletAddress.startsWith("0x") ? "binance" : "solana",
        balance: Math.floor(Math.random() * 500000),
        activities: Math.floor(Math.random() * 50),
        successRate: Math.floor(Math.random() * 30) + 60,
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
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TrackingWallets;
