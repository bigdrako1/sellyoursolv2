
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenList from "@/components/TokenList";
import TokenMonitor from "@/components/TokenMonitor";
import TokenQualityFilter from "@/components/TokenQualityFilter";
import TokenWatchlist from "@/components/TokenWatchlist";
import PotentialRunnersDetector from "@/components/PotentialRunnersDetector";

const TokensPage = () => {
  return (
    <div className="container mx-auto py-6">
      <h2 className="text-3xl font-bold mb-6">Token Management</h2>
      
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Token List</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="quality">Quality Filter</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="runners">Runners</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <TokenList />
        </TabsContent>
        
        <TabsContent value="monitor">
          <TokenMonitor />
        </TabsContent>
        
        <TabsContent value="quality">
          <TokenQualityFilter />
        </TabsContent>
        
        <TabsContent value="watchlist">
          <TokenWatchlist />
        </TabsContent>
        
        <TabsContent value="runners">
          <PotentialRunnersDetector />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TokensPage;
