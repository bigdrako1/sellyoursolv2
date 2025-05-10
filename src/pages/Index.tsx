
import React, { useState, useEffect } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import TokenAlertMonitor from "@/components/TokenAlertMonitor";
import TokenAlert from "@/components/TokenAlert";
import Dashboard from "@/components/Dashboard";
import ConnectedServices from "@/components/ConnectedServices";

const Index: React.FC = () => {
  const { isAuthenticated, walletAddress, signIn } = useAuth();
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState<number | null>(42);
  const [activeStrategies, setActiveStrategies] = useState(2);
  const [totalProfit, setTotalProfit] = useState(1234.56);
  const [pendingTrades, setPendingTrades] = useState(3);
  const [totalTrades, setTotalTrades] = useState(142);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  
  useEffect(() => {
    // Simulate random system status and latency
    const interval = setInterval(() => {
      setSystemActive(Math.random() > 0.1);
      setSystemLatency(Math.floor(Math.random() * 100) + 30);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleWalletConnect = async (address: string) => {
    // This only sets the wallet address without authentication
    // Authentication is handled separately in the Auth page
  };
  
  const handleWalletDisconnect = () => {
    // Wallet disconnect is handled in AuthContext
  };
  
  const handleStrategyChange = (strategyName: string, settings: any) => {
    console.log(`Strategy ${strategyName} settings updated:`, settings);
  };

  const handleAlertToggle = (enabled: boolean) => {
    setAlertsEnabled(enabled);
    console.log("Token alerts toggled:", enabled);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <TokenAlert 
                onAlertToggle={handleAlertToggle}
                initiallyEnabled={alertsEnabled}
              />
              <ConnectedServices />
            </div>
            <Dashboard 
              totalProfit={totalProfit}
              activeStrategies={activeStrategies}
              pendingTrades={pendingTrades}
              totalTrades={totalTrades}
              systemLatency={systemLatency}
              systemActive={systemActive}
              onStrategyChange={handleStrategyChange}
            />
          </div>
        ) : (
          <WelcomeScreen onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
        )}
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Index;
