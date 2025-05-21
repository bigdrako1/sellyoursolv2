import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Wallet, 
  Plus, 
  ExternalLink, 
  X, 
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Copy,
  Trash2,
  Eye,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

/**
 * Enhanced TrackedWallet interface that combines properties from both
 * WalletMonitor and TrackingWallets components
 */
interface TrackedWallet {
  id?: number;
  address: string;
  label?: string;
  alias?: string;
  dateAdded?: string;
  lastActivity?: string;
  chain?: "solana" | "binance";
  balance?: number;
  activities?: number;
  successRate?: number;
  tracked?: boolean;
  isSmartWallet?: boolean;
}

/**
 * Activity interface for wallet transactions
 */
interface WalletActivity {
  id: number;
  walletId?: number;
  walletAddress?: string;
  action: "Buy" | "Sell" | "Swap" | "Transfer";
  token: string;
  amount: number;
  value: number;
  timestamp: string;
  profit?: number;
}

// Default smart wallets that are always tracked
const SMART_WALLETS: TrackedWallet[] = [
  { 
    address: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT", 
    label: "Smart Trader 1",
    isSmartWallet: true,
    chain: "solana",
    successRate: 92,
    tracked: true
  },
  { 
    address: "DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU", 
    label: "SOL Whale",
    isSmartWallet: true,
    chain: "solana",
    successRate: 88,
    tracked: true
  },
];

interface WalletTrackerProps {
  /** Optional title for the component */
  title?: string;
  /** Whether to show the detailed table view (false shows compact view) */
  detailedView?: boolean;
  /** Whether to show recent activities */
  showActivities?: boolean;
  /** Optional class name for styling */
  className?: string;
  /** Optional callback when a wallet is added */
  onWalletAdded?: (wallet: TrackedWallet) => void;
  /** Optional callback when a wallet is removed */
  onWalletRemoved?: (address: string) => void;
}

/**
 * WalletTracker component - consolidated from WalletMonitor and TrackingWallets
 * Provides functionality to track and monitor wallet addresses
 */
const WalletTracker: React.FC<WalletTrackerProps> = ({
  title = "Wallet Tracker",
  detailedView = false,
  showActivities = false,
  className = "",
  onWalletAdded,
  onWalletRemoved
}) => {
  // State
  const [wallets, setWallets] = useState<TrackedWallet[]>(SMART_WALLETS);
  const [activities, setActivities] = useState<WalletActivity[]>([]);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [newLabel, setNewLabel] = useState("");
  
  // Load saved wallets from localStorage
  useEffect(() => {
    const savedWallets = localStorage.getItem('tracked_wallets');
    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets);
        // Ensure we're handling array of strings or objects properly
        const processedWallets = Array.isArray(parsedWallets) ? parsedWallets.map((w, index) => {
          // If it's just a string (address), convert to object format
          if (typeof w === 'string') {
            return { 
              id: index + 1,
              address: w,
              tracked: true,
              chain: "solana"
            };
          }
          // Ensure ID is set
          if (!w.id) {
            w.id = index + 1;
          }
          return w;
        }) : [];
        
        const smartWalletAddresses = SMART_WALLETS.map(w => w.address);
        const filteredSavedWallets = processedWallets.filter(
          (w: TrackedWallet) => !smartWalletAddresses.includes(w.address)
        );
        
        // Combine smart wallets with user wallets
        setWallets([...SMART_WALLETS, ...filteredSavedWallets]);
      } catch (error) {
        console.error("Error loading wallet data:", error);
      }
    }
  }, []);
  
  // Save wallets to localStorage when they change
  useEffect(() => {
    localStorage.setItem('tracked_wallets', JSON.stringify(wallets));
  }, [wallets]);
  
  // Add a new wallet to tracking
  const handleAddWallet = () => {
    if (newWallet && newWallet.length >= 32) {
      if (wallets.some(w => w.address === newWallet)) {
        toast("Wallet already tracked", {
          description: "This wallet address is already being monitored"
        });
        return;
      }
      
      const newWalletObj: TrackedWallet = {
        id: wallets.length + 1,
        address: newWallet,
        label: newLabel || undefined,
        alias: newLabel || undefined,
        dateAdded: new Date().toISOString(),
        chain: newWallet.startsWith("0x") ? "binance" : "solana",
        balance: 0,
        activities: 0,
        successRate: 0,
        tracked: true
      };
      
      setWallets([...wallets, newWalletObj]);
      setNewWallet("");
      setNewLabel("");
      setIsAddingWallet(false);
      
      toast("Wallet added", {
        description: "The wallet has been added to your tracking list"
      });
      
      if (onWalletAdded) {
        onWalletAdded(newWalletObj);
      }
    } else {
      toast("Invalid wallet address", {
        description: "Please enter a valid wallet address"
      });
    }
  };
  
  // Remove a wallet from tracking
  const handleRemoveWallet = (address: string) => {
    const isSmartWallet = SMART_WALLETS.some(w => w.address === address);
    
    if (isSmartWallet) {
      toast("Cannot remove default wallet", {
        description: "Smart trader wallets cannot be removed from tracking"
      });
      return;
    }
    
    setWallets(wallets.filter(wallet => wallet.address !== address));
    toast("Wallet removed", {
      description: "The wallet has been removed from your tracking list"
    });
    
    if (onWalletRemoved) {
      onWalletRemoved(address);
    }
  };
  
  // Toggle wallet tracking status
  const toggleTracking = (id: number) => {
    setWallets(wallets.map(wallet => 
      wallet.id === id ? { ...wallet, tracked: !wallet.tracked } : wallet
    ));
  };
  
  // Helper functions
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  const formatBalance = (balance?: number) => {
    if (!balance) return "$0.00";
    
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
  
  // Copy wallet address to clipboard
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast("Address copied", {
      description: "Wallet address copied to clipboard"
    });
  };

  // Render the component
  return (
    <Card className={`card-with-border ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {title}
          </div>
          <div className="flex items-center gap-2">
            {!isAddingWallet && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsAddingWallet(true)} 
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-trading-darkAccent border-white/10 hover:bg-white/10"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add wallet form */}
          {isAddingWallet && (
            <div className="space-y-2 bg-black/20 p-3 rounded-md">
              <Input
                placeholder="Enter wallet label (optional)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="bg-black/30 border-white/10 mb-2"
              />
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter wallet address"
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                  className="bg-black/30 border-white/10"
                />
                <Button onClick={handleAddWallet}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsAddingWallet(false);
                    setNewWallet("");
                    setNewLabel("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {/* Wallet list - detailed view */}
          {detailedView && wallets.length > 0 && (
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
                      <tr key={wallet.address} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Wallet size={14} className={wallet.isSmartWallet ? "text-blue-400" : "text-trading-highlight"} />
                            <div>
                              <div className="font-medium">{wallet.label || wallet.alias || truncateAddress(wallet.address)}</div>
                              <div className="text-xs text-gray-400">{truncateAddress(wallet.address)}</div>
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
                          {wallet.activities || 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`inline-flex items-center gap-1 ${
                            (wallet.successRate || 0) > 80 ? 'text-trading-success' : 
                            (wallet.successRate || 0) > 65 ? 'text-trading-warning' : 'text-trading-danger'
                          }`}>
                            {wallet.successRate || 0}%
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
                              {wallet.id && (
                                <DropdownMenuItem onClick={() => toggleTracking(wallet.id)} className="cursor-pointer">
                                  <Eye size={14} className="mr-2" />
                                  {wallet.tracked ? 'Stop Tracking' : 'Start Tracking'}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => copyAddress(wallet.address)} className="cursor-pointer">
                                <Copy size={14} className="mr-2" />
                                Copy Address
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`https://solscan.io/account/${wallet.address}`, '_blank')} className="cursor-pointer">
                                <ExternalLink size={14} className="mr-2" />
                                View on Explorer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveWallet(wallet.address)} 
                                disabled={wallet.isSmartWallet}
                                className="text-trading-danger cursor-pointer"
                              >
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
          )}
          
          {/* Wallet list - compact view */}
          {!detailedView && (
            <div className="space-y-2">
              {wallets.length > 0 ? (
                wallets.map((wallet: TrackedWallet) => {
                  const isSmartWallet = wallet.isSmartWallet || SMART_WALLETS.some(w => w.address === wallet.address);
                  
                  return (
                    <div 
                      key={wallet.address} 
                      className={`p-2 ${isSmartWallet ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-black/20'} rounded flex items-center justify-between`}
                    >
                      <div className="overflow-hidden">
                        <div className="font-mono text-xs truncate">
                          {(wallet.label || wallet.alias) && (
                            <span className={`${isSmartWallet ? 'text-blue-400' : 'text-gray-400'} mr-2`}>
                              {wallet.label || wallet.alias}:
                            </span>
                          )}
                          {truncateAddress(wallet.address)}
                        </div>
                        {isSmartWallet && (
                          <div className="text-[10px] text-blue-300 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            Smart money wallet (auto-tracked)
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => window.open(`https://solscan.io/account/${wallet.address}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className={`h-6 w-6 ${isSmartWallet ? 'opacity-50 cursor-not-allowed' : 'text-red-500 hover:text-red-400 hover:bg-red-900/20'}`}
                          onClick={() => !isSmartWallet && handleRemoveWallet(wallet.address)}
                          disabled={isSmartWallet}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-sm text-gray-400">
                  No wallets being tracked
                </div>
              )}
            </div>
          )}
          
          {/* Recent activities */}
          {showActivities && (
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
                    const wallet = activity.walletId 
                      ? wallets.find(w => w.id === activity.walletId)
                      : wallets.find(w => w.address === activity.walletAddress);
                      
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
                              <span className="text-xs text-gray-400 ml-2">via {wallet?.label || wallet?.alias || truncateAddress(wallet?.address || '')}</span>
                            </div>
                            <div className="text-xs text-gray-400">{formatTime(activity.timestamp)}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${activity.value.toFixed(2)}</div>
                          {activity.profit !== undefined && activity.profit !== 0 && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletTracker;
