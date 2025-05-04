
import React, { useState, useEffect } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import TokenAlertMonitor from "@/components/TokenAlertMonitor";

const Index: React.FC = () => {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState<number | null>(42);
  
  useEffect(() => {
    // Check if wallet is already connected on mount
    const storedWallet = localStorage.getItem('walletAddress');
    if (storedWallet) {
      setConnectedWallet(storedWallet);
    }
    
    // Simulate random system status and latency
    const interval = setInterval(() => {
      setSystemActive(Math.random() > 0.1);
      setSystemLatency(Math.floor(Math.random() * 100) + 30);
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleWalletConnect = (address: string) => {
    setConnectedWallet(address);
  };
  
  const handleWalletDisconnect = () => {
    setConnectedWallet(null);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <>
            <TokenAlertMonitor />
            <div className="mt-8">
              <p className="text-gray-400">
                Welcome back! You are authenticated and can access all features.
              </p>
            </div>
          </>
        ) : (
          <WelcomeScreen onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
        )}
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Index;
