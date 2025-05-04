
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, ExternalLink, X } from "lucide-react";

interface TrackedWallet {
  address: string;
  label?: string;
}

const WalletMonitor: React.FC = () => {
  const [wallets, setWallets] = useState<TrackedWallet[]>([
    { address: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT", label: "Smart Trader 1" }
  ]);
  const [newWallet, setNewWallet] = useState("");
  const { toast } = useToast();
  
  const handleAddWallet = () => {
    if (newWallet && newWallet.length >= 32) {
      if (wallets.some(w => w.address === newWallet)) {
        toast({
          title: "Wallet already tracked",
          description: "This wallet address is already being monitored",
          variant: "destructive"
        });
        return;
      }
      
      setWallets([...wallets, { address: newWallet }]);
      setNewWallet("");
      toast({
        title: "Wallet added",
        description: "The wallet has been added to your tracking list"
      });
    } else {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid Solana wallet address",
        variant: "destructive"
      });
    }
  };
  
  const handleRemoveWallet = (address: string) => {
    setWallets(wallets.filter(wallet => wallet.address !== address));
    toast({
      title: "Wallet removed",
      description: "The wallet has been removed from your tracking list"
    });
  };
  
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Wallet Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Solana wallet address"
              value={newWallet}
              onChange={(e) => setNewWallet(e.target.value)}
              className="bg-black/20 border-white/10"
            />
            <Button onClick={handleAddWallet}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <div 
                  key={wallet.address} 
                  className="p-2 bg-black/20 rounded flex items-center justify-between"
                >
                  <div className="overflow-hidden">
                    <div className="font-mono text-xs truncate">
                      {wallet.label && <span className="text-gray-400 mr-2">{wallet.label}:</span>}
                      {truncateAddress(wallet.address)}
                    </div>
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
                      className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-900/20"
                      onClick={() => handleRemoveWallet(wallet.address)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
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
