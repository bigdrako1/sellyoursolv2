
import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioPerformance from "@/components/PerformanceMetrics";
import PortfolioHistory from "@/components/PortfolioHistory";
import { getConnectedWallet } from "@/utils/walletUtils";
import { testHeliusConnection } from "@/utils/apiUtils";

const Portfolio: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemActive, setSystemActive] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [walletData, setWalletData] = useState({
    totalValue: 0,
    change24h: 0,
    changePercentage: 0,
    allocation: []
  });
  
  // Check for connected wallet and API on mount
  useEffect(() => {
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
    
    // Check API connection
    const checkApiStatus = async () => {
      try {
        const startTime = Date.now();
        const connected = await testHeliusConnection();
        const latency = Date.now() - startTime;
        
        setSystemActive(connected);
        setSystemLatency(latency);
      } catch (error) {
        console.error('API connection check failed:', error);
        setSystemActive(false);
      }
    };
    
    checkApiStatus();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Portfolio</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <PortfolioOverview walletData={walletData} />
            <PortfolioPerformance />
          </div>
          
          <PortfolioAssets />
          <div className="mt-4">
            <PortfolioHistory walletAddress={walletAddress} />
          </div>
        </div>
      </main>
      
      <Footer systemActive={systemActive} systemLatency={systemLatency} />
    </div>
  );
};

export default Portfolio;
