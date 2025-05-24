
import React, { useState, useEffect } from 'react';
import PortfolioOverview from "@/components/PortfolioOverview";
import PortfolioAssets from "@/components/PortfolioAssets";
import PortfolioPerformance from "@/components/PerformanceMetrics";
import PortfolioHistory from "@/components/PortfolioHistory";
import { getConnectedWallet } from "@/utils/solanaWalletUtils";
import { testHeliusConnection } from "@/utils/apiUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Settings, TrendingUp, BarChart, AlertTriangle, Wallet, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Portfolio: React.FC = () => {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [systemActive, setSystemActive] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Enhanced refresh functionality
  const handleRefreshPortfolio = async () => {
    setIsRefreshing(true);
    try {
      // Trigger refresh of all portfolio components
      window.location.reload(); // Simple approach - in production, you'd trigger component refreshes
      toast.success('Portfolio data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh portfolio data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Quick action handlers
  const handleViewMarketAnalysis = () => {
    navigate('/market-analysis');
    toast.success('Navigating to Market Analysis');
  };

  const handleOpenTrading = () => {
    navigate('/auto-trading');
    toast.success('Opening Trading Interface');
  };

  const handleManageSettings = () => {
    navigate('/settings');
    toast.success('Opening Settings');
  };

  const handleViewWalletExplorer = () => {
    if (walletAddress) {
      window.open(`https://solscan.io/account/${walletAddress}`, '_blank');
      toast.success('Opening wallet in Solscan');
    } else {
      toast.error('No wallet connected');
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="text-gray-400 mt-1">Track your Solana assets and performance</p>
        </div>

        <div className="flex items-center gap-3">
          {/* System Status */}
          <div className="flex items-center gap-2">
            <Badge
              className={`${systemActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
            >
              {systemActive ? 'Connected' : 'Disconnected'}
            </Badge>
            {systemLatency && (
              <span className="text-xs text-gray-400">
                {systemLatency}ms
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <Button
            onClick={handleRefreshPortfolio}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Wallet Status Card */}
      {walletAddress ? (
        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <div className="font-medium text-white">Wallet Connected</div>
                  <div className="text-sm text-gray-400 font-mono">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleViewWalletExplorer}
                  variant="outline"
                  size="sm"
                  className="bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Solscan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="font-medium text-white">No Wallet Connected</div>
                <div className="text-sm text-gray-400">Connect a wallet to view your portfolio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Bar */}
      <Card className="bg-trading-darkAccent border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleViewMarketAnalysis}
              variant="outline"
              className="bg-purple-500/20 border-purple-500/30 text-purple-400 hover:bg-purple-500/30"
            >
              <BarChart className="h-4 w-4 mr-2" />
              Market Analysis
            </Button>
            <Button
              onClick={handleOpenTrading}
              variant="outline"
              className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Start Trading
            </Button>
            <Button
              onClick={handleManageSettings}
              variant="outline"
              className="bg-gray-500/20 border-gray-500/30 text-gray-400 hover:bg-gray-500/30"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

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
