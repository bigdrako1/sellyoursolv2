
import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioPerformance from "@/components/PortfolioPerformance";
import PortfolioHistory from "@/components/PortfolioHistory";
import { getConnectedWallet } from "@/utils/walletUtils";

interface WalletData {
  address: string;
  balance: number;
  tokens: Array<{
    name: string;
    symbol: string;
    amount: number;
    value: number;
  }>;
}

const Portfolio: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemActive, setSystemActive] = useState(true);
  const [systemLatency, setSystemLatency] = useState(25);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  
  // Check for connected wallet on mount
  useEffect(() => {
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
      
      // Mock wallet data for demonstration
      setWalletData({
        address: savedWallet,
        balance: 123.45,
        tokens: [
          { name: "Solana", symbol: "SOL", amount: 12.5, value: 1250.00 },
          { name: "USDC", symbol: "USDC", amount: 500, value: 500.00 },
          { name: "Raydium", symbol: "RAY", amount: 100, value: 120.00 },
        ]
      });
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark text-white">
      <Header walletAddress={walletAddress || ""} />
      
      <main className="flex-grow container mx-auto px-4 pb-10">
        <div className="py-6">
          <h1 className="text-3xl font-bold mb-6">Portfolio</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <PortfolioOverview walletData={walletData || {
              totalValue: 0,
              change24h: 0,
              changePercentage: 0,
              allocation: []
            }} />
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
