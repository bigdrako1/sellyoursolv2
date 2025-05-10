
import React from "react";
import { Card } from "@/components/ui/card";
import WalletBalances from "@/components/WalletBalances";
import WalletAddressInput from "@/components/WalletAddressInput";
import TrackingWallets from "@/components/TrackingWallets";
import TransactionHistory from "@/components/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WalletsPage = () => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Wallet Management</h2>
      
      <Tabs defaultValue="my-wallets" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="my-wallets">My Wallets</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-wallets">
          <Card className="p-6">
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-4">Your Wallets</h3>
              <WalletBalances />
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <WalletAddressInput />
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="tracking">
          <TrackingWallets />
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletsPage;
