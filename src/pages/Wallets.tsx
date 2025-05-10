
import React from "react";
import { Card } from "@/components/ui/card";
import WalletBalances from "@/components/WalletBalances";
import WalletAddressInput from "@/components/WalletAddressInput";
import TrackingWallets from "@/components/TrackingWallets";
import TransactionHistory from "@/components/TransactionHistory";

const WalletsPage = () => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Wallet Management</h2>
      
      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-4">Your Wallets</h3>
            <WalletBalances />
          </div>
          
          <div className="pt-4 border-t border-white/10">
            <WalletAddressInput />
          </div>
        </Card>
        
        <TrackingWallets />
        
        <TransactionHistory />
      </div>
    </div>
  );
};

export default WalletsPage;
