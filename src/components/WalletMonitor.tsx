
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Wallet, Plus, ExternalLink, X, AlertCircle } from "lucide-react";

interface TrackedWallet {
  address: string;
  label?: string;
  dateAdded?: string;
  lastActivity?: string;
}

const SMART_WALLETS: TrackedWallet[] = [
  { address: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT", label: "Smart Trader 1" },
  { address: "DWkZXkZKuqeM1aM991Kz6BVLuGgzWEyK9K4YqgJV6EEU", label: "SOL Whale" },
];

const WalletMonitor: React.FC = () => {
  const [wallets, setWallets] = useState<TrackedWallet[]>(SMART_WALLETS);
  const [newWallet, setNewWallet] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  
  useEffect(() => {
    const savedWallets = localStorage.getItem('tracked_wallets');
    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets);
        // Ensure we're handling array of strings or objects properly
        const processedWallets = Array.isArray(parsedWallets) ? parsedWallets.map(w => {
          // If it's just a string (address), convert to object format
          if (typeof w === 'string') {
            return { address: w };
          }
          return w;
        }) : [];
        
        const smartWalletAddresses = SMART_WALLETS.map(w => w.address);
        const filteredSavedWallets = processedWallets.filter(
          (w: TrackedWallet) => !smartWalletAddresses.includes(w.address)
        );
        setWallets([...SMART_WALLETS, ...filteredSavedWallets]);
      } catch (error) {
        console.error("Error loading wallet data:", error);
      }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('tracked_wallets', JSON.stringify(wallets));
  }, [wallets]);
  
  const handleAddWallet = () => {
    if (newWallet && newWallet.length >= 32) {
      if (wallets.some(w => w.address === newWallet)) {
        toast("Wallet already tracked", {
          description: "This wallet address is already being monitored"
        });
        return;
      }
      
      const newWalletObj: TrackedWallet = {
        address: newWallet,
        label: newLabel || undefined,
        dateAdded: new Date().toISOString(),
      };
      
      setWallets([...wallets, newWalletObj]);
      setNewWallet("");
      setNewLabel("");
      setIsAddingWallet(false);
      
      toast("Wallet added", {
        description: "The wallet has been added to your tracking list"
      });
    } else {
      toast("Invalid wallet address", {
        description: "Please enter a valid Solana wallet address"
      });
    }
  };
  
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
  };
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Tracker
          </div>
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
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                  placeholder="Enter Solana wallet address"
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
          
          <div className="space-y-2">
            {wallets.length > 0 ? (
              wallets.map((wallet: TrackedWallet) => {
                const isSmartWallet = SMART_WALLETS.some(w => w.address === wallet.address);
                
                return (
                  <div 
                    key={wallet.address} 
                    className={`p-2 ${isSmartWallet ? 'bg-blue-900/20 border border-blue-500/20' : 'bg-black/20'} rounded flex items-center justify-between`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-mono text-xs truncate">
                        {wallet.label && (
                          <span className={`${isSmartWallet ? 'text-blue-400' : 'text-gray-400'} mr-2`}>
                            {wallet.label}:
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
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletMonitor;
