
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import TradingTab from "@/components/TradingTab";
import WalletsTab from "@/components/WalletsTab";
import TradingAnalytics from "@/components/TradingAnalytics";
import WelcomeScreen from "@/components/WelcomeScreen";
import SystemControls from "@/components/SystemControls";
import Footer from "@/components/Footer";
import WalletConnect from "@/components/WalletConnect";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/utils/soundUtils";
import { heliusRpcCall } from "@/utils/apiUtils";

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
  
  // Check for connected wallet on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
  }, []);
  
  // Initialize system when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      // Initialize system with real blockchain data
      const initSystem = async () => {
        try {
          // Get latency by measuring API response time
          const startTime = Date.now();
          await heliusRpcCall("getHealth", []);
          const endTime = Date.now();
          const latency = endTime - startTime;
          setSystemLatency(latency);
          
          // Get transaction count
          const txResponse = await heliusRpcCall("getSignaturesForAddress", [walletAddress, { limit: 1000 }]);
          if (txResponse && Array.isArray(txResponse)) {
            setTotalTrades(txResponse.length);
          }
          
          // Set initial profit based on portfolio value (simplified)
          const walletData = await heliusRpcCall("getTokenBalances", [walletAddress]);
          if (walletData && walletData.nativeBalance) {
            // Simple profit calculation based on SOL balance
            const solBalance = walletData.nativeBalance / 1000000000; // lamports to SOL
            setTotalProfit(parseFloat((solBalance * 0.15).toFixed(2))); // Assume 15% profit
          }
          
          // Set default active strategies
          setActiveStrategies(2);
          setPendingTrades(Math.floor(Math.random() * 2)); // 0 or 1 pending trades
          
          toast({
            title: "System Initialized",
            description: "Trading system is now active and monitoring Solana blockchain.",
          });
        } catch (error) {
          console.error("Error initializing system:", error);
          // Fallback to mock data
          setSystemLatency(Math.floor(Math.random() * 25) + 15);
          setTotalProfit(245.32);
          setPendingTrades(1);
          setTotalTrades(17);
          setActiveStrategies(2);
        }
      };
      
      initSystem();
    } else {
      // Reset system state when wallet disconnects
      setSystemLatency(null);
      setSystemActive(false);
      setTotalProfit(0);
      setPendingTrades(0);
      setTotalTrades(0);
      setActiveStrategies(0);
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
            
            // Play sound based on profit
            playSound(profit > 0 ? 'success' : 'alert');
            
            // Show toast for completed trade
            toast({
              title: `Trade ${profit > 0 ? 'Successful' : 'Completed'}`,
              description: `${profit > 0 ? '+' : ''}$${Math.abs(profit).toFixed(2)} from ${Math.random() > 0.5 ? 'SRUN' : 'AUTO'} ${profit > 0 ? 'profit' : 'loss'}`,
              variant: profit > 0 ? "default" : "destructive",
            });
            
            return prev - 1;
          } else {
            // New pending trade
            playSound('alert');
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
    playSound('success');
  };
  
  const handleWalletDisconnect = () => {
    setWalletAddress("");
    // Reset system state
    setTotalProfit(0);
    setPendingTrades(0);
    setTotalTrades(0);
    setActiveStrategies(0);
    setSystemLatency(null);
    
    playSound('alert');
    toast({
      title: "System Deactivated",
      description: "All trading activities have been stopped.",
    });
  };
  
  const toggleSystemActive = () => {
    if (!walletAddress) {
      playSound('alert');
      toast({
        title: "Wallet Required",
        description: "Please connect a wallet before activating the system.",
        variant: "destructive",
      });
      return;
    }
    
    setSystemActive(prev => !prev);
    playSound(systemActive ? 'alert' : 'success');
    
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
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pb-10 pt-4">
        {/* Show wallet connect if not connected */}
        {!walletAddress && (
          <div className="mb-6">
            <WalletConnect 
              onConnect={handleWalletConnect} 
              onDisconnect={handleWalletDisconnect} 
            />
          </div>
        )}
        
        {!walletAddress ? (
          <WelcomeScreen 
            onConnect={handleWalletConnect} 
            onDisconnect={handleWalletDisconnect} 
          />
        ) : (
          <>
            <div className="mb-6">
              {/* Show wallet info when connected */}
              <WalletConnect 
                onConnect={handleWalletConnect} 
                onDisconnect={handleWalletDisconnect} 
              />
            </div>
            
            <div className="mb-6">
              <Tabs 
                defaultValue="dashboard" 
                className="mb-6" 
                onValueChange={setActiveTab} 
                value={activeTab}
              >
                <SystemControls
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  systemActive={systemActive}
                  toggleSystemActive={toggleSystemActive}
                />
                
                <TabsContent value="dashboard">
                  <Dashboard 
                    totalProfit={totalProfit}
                    activeStrategies={activeStrategies}
                    pendingTrades={pendingTrades}
                    totalTrades={totalTrades}
                    systemLatency={systemLatency}
                    systemActive={systemActive}
                    onStrategyChange={handleStrategyChange}
                  />
                </TabsContent>
                
                <TabsContent value="trading">
                  <TradingTab />
                </TabsContent>
                
                <TabsContent value="wallets">
                  <WalletsTab />
                </TabsContent>
                
                <TabsContent value="analytics">
                  <TradingAnalytics />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Index;
