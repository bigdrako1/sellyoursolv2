
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import WalletBalances from "@/components/WalletBalances";
import TrackingWallets from "@/components/TrackingWallets";
import { Wallet } from "lucide-react";
import WalletAddressInput from "@/components/WalletAddressInput";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const WalletsTabContent = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-blue-500" />
              <h3 className="text-lg font-semibold">Wallet Management</h3>
            </div>
            
            <Link to="/wallets">
              <Button variant="outline" size="sm" className="bg-trading-darkAccent border-white/10 hover:bg-white/10">
                View All Wallets
              </Button>
            </Link>
          </div>
          
          <div className="space-y-6">
            <WalletBalances />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletsTabContent;
