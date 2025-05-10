
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import WalletBalances from "@/components/WalletBalances";
import TrackingWallets from "@/components/TrackingWallets";
import { Wallet, ArrowRight } from "lucide-react";

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
            
            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium mb-3">Smart Wallet Tracking</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-track" className="cursor-pointer flex items-center gap-2">
                    Auto-track profitable wallets
                  </Label>
                  <Switch id="auto-track" />
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter wallet address to track"
                    className="bg-black/30 border-white/10"
                  />
                  <Button className="gap-1">
                    Track <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <TrackingWallets />
    </div>
  );
};

export default WalletsTabContent;
