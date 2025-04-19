
import { useState, useEffect } from "react";
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
import SystemStatus from "@/components/SystemStatus";
import TradeAlerts from "@/components/TradeAlerts";
import TradingAnalytics from "@/components/TradingAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/components/ui/use-toast";
import { Activity, Zap, Bot, BarChart2, Settings, ChevronDown, Brain, AlertTriangle } from "lucide-react";
import { calculateStrategyProfitability } from "@/utils/tradingUtils";

const Index = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [systemActive, setSystemActive] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [totalProfit, setTotalProfit] = useState(0);
  const [pendingTrades, setPendingTrades] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [activeStrategies, setActiveStrategies] = useState(0);
  const { toast } = useToast();
  
  // Simulate system initialization on wallet connection
  useEffect(() => {
    if (walletAddress) {
      // Simulate system initialization with a delay
      const initTimer = setTimeout(() => {
        // Random latency between 15-40ms
        setSystemLatency(Math.floor(Math.random() * 25) + 15);
        
        // Set initial metrics
        setTotalProfit(245.32);
        setPendingTrades(1);
        setTotalTrades(17);
        setActiveStrategies(2);
        
        toast({
          title: "System Initialized",
          description: "Trading system is now active and monitoring markets.",
        });
      }, 2000);
      
      return () => clearTimeout(initTimer);
    } else {
      // Reset system state when wallet disconnects
      setSystemLatency(null);
      setSystemActive(false);
    }
  }, [walletAddress]);
  
  // Simulate occasional system activity
  useEffect(() => {
    if (!walletAddress || !systemLatency) return;
    
    const activityInterval = setInterval(() => {
      // Randomize latency changes to simulate network conditions
      setSystemLatency(prev => prev ? Math.max(15, Math.min(40, prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5))) : null);
      
      // Occasionally simulate a new trade
      if (Math.random() > 0.7) {
        setPendingTrades(prev => {
          // 80% chance to decrease pending (trade completed)
          if (prev > 0 && Math.random() > 0.2) {
            setTotalTrades(t => t + 1);
            
            // 70% chance of profitable trade
            const profit = Math.random() > 0.3 ? (Math.random() * 20) + 5 : -(Math.random() * 10);
            setTotalProfit(prev => +(prev + profit).toFixed(2));
            
            // Show toast for completed trade
            toast({
              title: `Trade ${profit > 0 ? 'Successful' : 'Completed'}`,
              description: `${profit > 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)} from ${Math.random() > 0.5 ? 'SRUN' : 'AUTO'} ${profit > 0 ? 'profit' : 'loss'}`,
              variant: profit > 0 ? "default" : "destructive",
            });
            
            return prev - 1;
          } else {
            // New pending trade
            toast({
              title: "New Trade Detected",
              description: `Front Running strategy spotted opportunity in ${Math.random() > 0.5 ? 'SRUN' : 'SOL'}`,
            });
            return prev + 1;
          }
        });
      }
    }, 12000); // Activity updates every 12 seconds
    
    return () => clearInterval(activityInterval);
  }, [walletAddress, systemLatency]);
  
  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };
  
  const handleWalletDisconnect = () => {
    setWalletAddress("");
    // Reset system state
    setTotalProfit(0);
    setPendingTrades(0);
    setTotalTrades(0);
    setActiveStrategies(0);
    setSystemLatency(null);
    
    toast({
      title: "System Deactivated",
      description: "All trading activities have been stopped.",
    });
  };
  
  const toggleSystemActive = () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet before activating the system.",
        variant: "destructive",
      });
      return;
    }
    
    setSystemActive(prev => !prev);
    
    toast({
      title: systemActive ? "System Paused" : "System Activated",
      description: systemActive 
        ? "All automated trading operations have been paused."
        : "SolRunner AI is now actively trading based on your configuration.",
    });
  };
  
  const handleStrategyChange = (strategyName: string, settings: any) => {
    // Update active strategies count
    const enabledCount = settings.enabled 
      ? activeStrategies + 1 
      : Math.max(0, activeStrategies - 1);
    
    setActiveStrategies(enabledCount);
    
    toast({
      title: settings.enabled ? "Strategy Activated" : "Strategy Deactivated",
      description: `${strategyName} has been ${settings.enabled ? 'enabled' : 'disabled'}.`,
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Toaster position="top-right" />
      
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
              <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
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
                    <TabsTrigger value="analytics" className="gap-1">
                      <Activity size={14} /> Analytics
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={toggleSystemActive}
                      variant="outline"
                      className={`gap-1 transition-all duration-300 ${
                        systemActive 
                          ? "bg-trading-success/20 text-trading-success hover:bg-trading-success/30 border-trading-success/30" 
                          : "bg-trading-danger/20 text-trading-danger hover:bg-trading-danger/30 border-trading-danger/30"
                      }`}
                    >
                      {systemActive ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-trading-success animate-pulse"></div>
                          System Active
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} />
                          System Paused
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 bg-trading-darkAccent hover:bg-white/10 border-white/10">
                      <Settings size={14} />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="dashboard">
                  <div className="mb-6">
                    <Overview 
                      totalProfit={totalProfit} 
                      activeStrategies={activeStrategies} 
                      pendingTrades={pendingTrades} 
                      totalTrades={totalTrades} 
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
                          onSave={settings => handleStrategyChange("Front Running AI", settings)}
                        />
                        <StrategyConfig 
                          title="Market Runner Detection" 
                          description="Identify early market trends and capitalize on momentum"
                          defaultEnabled={true}
                          onSave={settings => handleStrategyChange("Market Runner Detection", settings)}
                        />
                        <StrategyConfig 
                          title="Wallet Activity Tracker" 
                          description="Track and mimic profitable wallet activities"
                          onSave={settings => handleStrategyChange("Wallet Activity Tracker", settings)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <SystemStatus latency={systemLatency} systemActive={systemActive} />
                    <TradeAlerts />
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
                
                <TabsContent value="analytics">
                  <TradingAnalytics />
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
                <div className={`w-2 h-2 rounded-full ${systemActive ? 'bg-trading-success' : 'bg-trading-danger'}`}></div>
                <span>{systemActive ? 'System Online' : 'System Offline'}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Activity size={14} className="text-trading-highlight" />
                <span>{systemLatency ? `${systemLatency}ms Latency` : 'Not Connected'}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Brain size={14} className="text-purple-400" />
                <span>AI {systemActive ? 'Active' : 'Standby'}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
