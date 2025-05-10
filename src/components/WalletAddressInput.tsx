
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addWallet } from "@/services/walletService";
import { isValidWalletAddress } from "@/utils/walletUtils";

const WalletAddressInput = () => {
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddWallet = async () => {
    // Validate the wallet address
    if (!newWalletAddress.trim()) {
      setValidationError("Please enter a wallet address");
      return;
    }
    
    if (!isValidWalletAddress(newWalletAddress)) {
      setValidationError("Invalid Solana wallet address format");
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to add wallets",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add wallet to Supabase
      const result = await addWallet(user.id, newWalletAddress, newWalletName);
      
      if (result) {
        // Save to localStorage for persistence as well
        localStorage.setItem('walletAddress', newWalletAddress);
        
        toast({
          title: "Wallet Added",
          description: "The wallet has been added successfully",
        });
        
        setNewWalletAddress("");
        setNewWalletName("");
        setShowAddWallet(false);
      } else {
        throw new Error("Failed to add wallet");
      }
    } catch (error: any) {
      console.error("Error adding wallet:", error);
      toast({
        title: "Error Adding Wallet",
        description: error.message || "Failed to add wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
      <h4 className="text-sm font-medium mb-3">Smart Wallet Tracking</h4>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-track" className="cursor-pointer flex items-center gap-2">
            Auto-track profitable wallets
          </Label>
          <Switch id="auto-track" />
        </div>
        
        {!showAddWallet ? (
          <div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowAddWallet(true);
                setValidationError("");
              }}
              className="bg-trading-darkAccent border-white/10 hover:bg-white/10 w-full"
            >
              <Plus size={14} className="mr-1" /> Add Wallet
            </Button>
          </div>
        ) : (
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
            <div>
              <Input 
                placeholder="Wallet Name (optional)" 
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                className="bg-black/30 border-white/10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                className="trading-button w-full"
                onClick={handleAddWallet}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <ArrowRight size={14} className="mr-1" /> Track
                  </>
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
                <X size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletAddressInput;
