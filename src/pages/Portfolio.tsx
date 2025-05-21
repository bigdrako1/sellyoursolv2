
import React, { useState, useEffect } from 'react';
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioPerformance from "@/components/PerformanceMetrics";
import PortfolioHistory from "@/components/PortfolioHistory";
import { getConnectedWallet } from "@/utils/solanaWalletUtils";
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
    if (savedWallet.address) {
      setWalletAddress(savedWallet.address);
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
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Portfolio</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <PortfolioOverview walletData={walletData} />
        <PortfolioPerformance />
      </div>

      <div className="mb-8">
        <PortfolioAssets />
      </div>

      <div className="mb-8">
        <PortfolioHistory walletAddress={walletAddress} />
      </div>
    </div>
  );
};

export default Portfolio;
