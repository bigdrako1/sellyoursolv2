
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import WalletBalances from "@/components/WalletBalances";
import TrackingWallets from "@/components/TrackingWallets";
import { Wallet } from "lucide-react";
import WalletAddressInput from "@/components/WalletAddressInput";

const WalletsTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-blue-500" />
            <h3 className="text-lg font-semibold">Wallet Management</h3>
          </div>
          
          <div className="space-y-6">
            <WalletBalances />
            <WalletAddressInput />
          </div>
        </CardContent>
      </Card>
      
      <TrackingWallets />
    </div>
  );
};

export default WalletsTabContent;
