
import { useState } from "react";
import Header from "@/components/Header";
import WalletConnect from "@/components/WalletConnect";
import Overview from "@/components/Overview";
import StrategyConfig from "@/components/StrategyConfig";
import TokenList from "@/components/TokenList";
import TransactionHistory from "@/components/TransactionHistory";
import MarketChart from "@/components/MarketChart";
import AutoTradeConfig from "@/components/AutoTradeConfig";
import PerformanceMetrics from "@/components/PerformanceMetrics";
import TrackingWallets from "@/components/TrackingWallets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Bot, BarChart2, Settings, ChevronDown, Brain } from "lucide-react";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        {!walletAddress ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-3 trading-gradient-text">SolRunner AI Trading</h1>
              <p className="text-gray-400 max-w-lg">
                Autonomous, AFK-capable trading system for Solana and Binance Smart Chain.
                Connect your wallet to begin trading with advanced AI strategies.
              </p>
            </div>
            <div className="w-full max-w-md">
              <WalletConnect onConnect={handleWalletConnect} />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Tabs defaultValue="dashboard" className="mb-6" onValueChange={setActiveTab} value={activeTab}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList className="bg-trading-darkAccent">
                    <TabsTrigger value="dashboard" className="gap-1">
                      <BarChart2 size={14} /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger value="trading" className="gap-1">
                      <Zap size={14} /> Auto Trading
                    </TabsTrigger>
                    <TabsTrigger value="wallets" className="gap-1">
                      <Bot size={14} /> Wallet Tracking
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-trading-success/20 text-trading-success border-none px-3 py-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                        System Active
                      </div>
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent hover:bg-white/10 border-white/10">
                      <Settings size={14} />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="dashboard">
                  <div className="mb-6">
                    <Overview 
                      totalProfit={245.32} 
                      activeStrategies={2} 
                      pendingTrades={1} 
                      totalTrades={17} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2">
                      <PerformanceMetrics />
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg mb-4">Active Strategies</h3>
                      <div className="space-y-4">
                        <StrategyConfig 
                          title="Front Running AI" 
                          description="Detect and execute trades ahead of identified market movements"
                          defaultEnabled={true}
                        />
                        <StrategyConfig 
                          title="Market Runner Detection" 
                          description="Identify early market trends and capitalize on momentum"
                          defaultEnabled={true}
                        />
                        <StrategyConfig 
                          title="Wallet Activity Tracker" 
                          description="Track and mimic profitable wallet activities"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="solana" className="mb-6">
                    <TabsList className="bg-trading-darkAccent w-full">
                      <TabsTrigger value="solana" className="flex-1">
                        <div className="w-3 h-3 rounded-full bg-solana mr-2"></div> Solana
                      </TabsTrigger>
                      <TabsTrigger value="binance" className="flex-1">
                        <div className="w-3 h-3 rounded-full bg-binance mr-2"></div> Binance Smart Chain
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="solana" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MarketChart symbol="SOL/USD" chain="solana" />
                        <MarketChart symbol="SRUN/SOL" chain="solana" />
                      </div>
                    </TabsContent>
                    <TabsContent value="binance" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MarketChart symbol="BNB/USD" chain="binance" />
                        <MarketChart symbol="FBOT/BNB" chain="binance" />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <TransactionHistory />
                </TabsContent>
                
                <TabsContent value="trading">
                  <div className="mb-6">
                    <AutoTradeConfig />
                  </div>
                  
                  <div className="mb-6">
                    <TokenList />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MarketChart symbol="SOL/USD" chain="solana" />
                    <MarketChart symbol="BNB/USD" chain="binance" />
                  </div>
                </TabsContent>
                
                <TabsContent value="wallets">
                  <div className="mb-6">
                    <TrackingWallets />
                  </div>
                  
                  <div className="mb-6">
                    <TransactionHistory />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>
      
      <footer className="glass-panel py-4 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400">
              © 2024 SolRunner AI. All rights reserved.
            </div>
            <div className="flex items-center gap-4 mt-2 md:mt-0">
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 rounded-full bg-trading-success"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Activity size={14} className="text-trading-highlight" />
                <span>25ms Latency</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Brain size={14} className="text-purple-400" />
                <span>AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
