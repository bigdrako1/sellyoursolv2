
import TransactionHistory from "@/components/TransactionHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import WalletBalances from "@/components/WalletBalances";

const WalletsTab = () => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");

  const handleAddWallet = () => {
    // Add your wallet handling code here
    if (newWalletAddress) {
      // For now we'll just toggle the form off to simulate success
      setNewWalletAddress("");
      setShowAddWallet(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Card className="trading-card">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Wallet Management</h3>
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
                  <RotateCw size={14} />
                </Button>
              </div>
            </div>
            
            {showAddWallet && (
              <div className="bg-black/20 rounded-lg p-3 mb-4 border border-white/10">
                <h4 className="text-sm font-medium mb-2">Add Wallet Address</h4>
                <div className="space-y-3">
                  <div>
                    <Input 
                      placeholder="Solana Wallet Address" 
                      value={newWalletAddress}
                      onChange={(e) => setNewWalletAddress(e.target.value)}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="trading-button w-full"
                      onClick={handleAddWallet}
                    >
                      Add Wallet
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
            
            <WalletBalances />
          </div>
        </Card>
      </div>
      
      <div className="mb-6">
        <TransactionHistory />
      </div>
    </>
  );
};

export default WalletsTab;
