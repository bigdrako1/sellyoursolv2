
import TransactionHistory from "@/components/TransactionHistory";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, RotateCw, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import WalletBalances from "@/components/WalletBalances";
import { isValidWalletAddress } from "@/utils/walletUtils";
import { useToast } from "@/hooks/use-toast";

const WalletsTab = () => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { toast } = useToast();

  const handleAddWallet = () => {
    // Validate the wallet address
    if (!newWalletAddress.trim()) {
      setValidationError("Please enter a wallet address");
      return;
    }
    
    if (!isValidWalletAddress(newWalletAddress)) {
      setValidationError("Invalid Solana wallet address format");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call to add wallet
    setTimeout(() => {
      // Save to localStorage for persistence
      localStorage.setItem('walletAddress', newWalletAddress);
      
      toast({
        title: "Wallet Added",
        description: "The wallet has been added successfully",
        action: <Check className="h-4 w-4 text-green-500" />
      });
      
      setNewWalletAddress("");
      setShowAddWallet(false);
      setIsSubmitting(false);
      
      // Reload the page to refresh wallet data
      window.location.reload();
    }, 1000);
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
                  onClick={() => {
                    setShowAddWallet(!showAddWallet);
                    setValidationError("");
                  }}
                  className="bg-trading-darkAccent border-white/10 hover:bg-white/10"
                >
                  <Plus size={14} className="mr-1" /> Add Wallet
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 bg-trading-darkAccent border-white/10 hover:bg-white/10"
                  onClick={() => window.location.reload()}
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
                      onChange={(e) => {
                        setNewWalletAddress(e.target.value);
                        setValidationError("");
                      }}
                      className={`bg-black/30 border-white/10 ${validationError ? 'border-red-500' : ''}`}
                    />
                    {validationError && (
                      <p className="text-xs text-red-500 mt-1">{validationError}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="trading-button w-full"
                      onClick={handleAddWallet}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCw className="h-4 w-4 animate-spin mr-2" />
                          Adding...
                        </>
                      ) : (
                        "Add Wallet"
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-white/10 hover:bg-white/10"
                      onClick={() => {
                        setShowAddWallet(false);
                        setValidationError("");
                      }}
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
