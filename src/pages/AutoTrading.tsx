
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SystemControls from "@/components/SystemControls";
import StrategyManager from "@/components/StrategyManager";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { getConnectedWallet } from "@/utils/walletUtils";

const AutoTrading: React.FC = () => {
  const [activeTab, setActiveTab] = useState("trading");
  const [systemActive, setSystemActive] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemLatency, setSystemLatency] = useState(25);
  
  // Check for connected wallet on mount
  React.useEffect(() => {
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
    
    // Mock latency updates for demonstration
    const interval = setInterval(() => {
      setSystemLatency(Math.floor(Math.random() * 20) + 15);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const toggleSystemActive = () => {
    setSystemActive(!systemActive);
  };
  
  const handleStrategyChange = (strategyName: string, settings: any) => {
    console.log(`Strategy "${strategyName}" updated:`, settings);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress || ""} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Auto Trading</h1>
          
          <SystemControls 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            systemActive={systemActive}
            toggleSystemActive={toggleSystemActive}
          />
          
          <Tabs defaultValue="trading">
            <TabsContent value="trading" className="mt-2">
              <StrategyManager />
            </TabsContent>
            <TabsContent value="analytics">
              {/* Analytics content would go here */}
            </TabsContent>
            <TabsContent value="wallets">
              {/* Wallet tracking content would go here */}
            </TabsContent>
            <TabsContent value="dashboard">
              {/* Dashboard content would go here */}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default AutoTrading;
