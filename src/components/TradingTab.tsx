
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradeAlerts from '@/components/TradeAlerts';
import TokenMonitor from '@/components/TokenMonitor';
import StrategyManager from '@/components/StrategyManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, LineChart, Bell, Repeat } from 'lucide-react';
import TokenList from '@/components/TokenList';
import { identifyPotentialRunners } from '@/utils/tradingUtils';
import LivePriceTracker from '@/components/LivePriceTracker';
import TokenWatchlist from '@/components/TokenWatchlist';
import TradingAnalyticsDashboard from '@/components/TradingAnalyticsDashboard';
import { useToast } from '@/hooks/use-toast';
import { APP_CONFIG } from '@/config/appDefinition';
import { testHeliusConnection } from '@/services/tokenDataService';

const TradingTab = () => {
  const [activeTab, setActiveTab] = useState('monitor');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const { toast } = useToast();

  // Check if Helius API key is already set
  useEffect(() => {
    const checkApiConnection = async () => {
      setIsCheckingConnection(true);
      try {
        const storedApiKey = localStorage.getItem('helius_api_key');

        // If user has a custom key, check it
        if (storedApiKey) {
          const isConnected = await testHeliusConnection();
          setApiKeyConfigured(isConnected);
          if (!isConnected) {
            toast({
              title: "API Connection Issue",
              description: "There was a problem connecting to the Helius API. Using default API key.",
              variant: "destructive",
            });
            // Fall back to default key
            localStorage.removeItem('helius_api_key');
          }
        } else {
          // Try with the default key
          const isConnected = await testHeliusConnection();
          setApiKeyConfigured(isConnected);

          if (!isConnected) {
            toast({
              title: "Default API Not Working",
              description: "The default API key is not working. Please configure your own API key.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error checking API connection:", error);
        setApiKeyConfigured(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };

    checkApiConnection();
  }, [toast]);

  // Toggle monitoring status
  const toggleMonitoring = () => {
    setShowMonitoring(!showMonitoring);

    toast({
      title: showMonitoring ? "Monitoring Paused" : "Monitoring Resumed",
      description: showMonitoring
        ? "Token monitoring has been paused. You won't receive new alerts."
        : "Token monitoring has been resumed. You'll now receive alerts for new tokens."
    });
  };

  const handleApiKeySet = async (apiKey: string) => {
    if (apiKey) {
      // Test the API key
      localStorage.setItem('helius_api_key', apiKey);
      const isConnected = await testHeliusConnection();

      if (isConnected) {
        setApiKeyConfigured(true);
        toast({
          title: "API Key Configured",
          description: "Your Helius API key has been set up successfully.",
        });
      } else {
        localStorage.removeItem('helius_api_key');
        setApiKeyConfigured(false);
        toast({
          title: "Invalid API Key",
          description: "The API key could not be verified. Please check and try again.",
          variant: "destructive",
        });
      }
    } else {
      setApiKeyConfigured(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-2xl font-bold">Trading Dashboard</h2>

        <div className="flex items-center gap-2">
          <LivePriceTracker />

          <Button
            variant="outline"
            size="sm"
            onClick={toggleMonitoring}
            className={`${showMonitoring ? 'bg-trading-success/20 text-trading-success' : 'bg-trading-danger/20 text-trading-danger'} border-white/10`}
          >
            {showMonitoring ? (
              <>
                <Eye className="mr-1 h-4 w-4" />
                Monitoring
              </>
            ) : (
              <>
                <EyeOff className="mr-1 h-4 w-4" />
                Paused
              </>
            )}
          </Button>

          <Badge
            variant="outline"
            className="bg-trading-highlight/20 text-trading-highlight border-trading-highlight/20 px-2"
          >
            <Repeat className="mr-1 h-3 w-3" />
            Jupiter
          </Badge>

          <Badge
            variant="outline"
            className="bg-trading-highlight/20 text-trading-highlight border-trading-highlight/20 px-2"
          >
            v2.0
          </Badge>
        </div>
      </div>

      {isCheckingConnection ? (
        <Card className="p-6 text-center">
          <div className="animate-pulse flex flex-col items-center justify-center">
            <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-blue-500 animate-spin mb-2"></div>
            <p>Checking API connection...</p>
          </div>
        </Card>
      ) : !apiKeyConfigured && (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center justify-center">
            <p>API connection not configured. Please check your settings.</p>
            <Button
              onClick={() => setApiKeyConfigured(true)}
              className="mt-4"
            >
              Continue Anyway
            </Button>
          </div>
        </Card>
      )}

      {(apiKeyConfigured || !isCheckingConnection) && (
        <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-black/20 border-white/10 border">
            <TabsTrigger value="monitor">Token Monitor</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor" className="space-y-4">
            {activeTab === 'monitor' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="lg:col-span-2">
                  <TokenList />
                </div>
                <TokenMonitor />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {activeTab === 'analytics' && (
              <TradingAnalyticsDashboard />
            )}
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
            {activeTab === 'watchlist' && (
              <TokenWatchlist />
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            {activeTab === 'strategy' && (
              <StrategyManager />
            )}
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            {activeTab === 'alerts' && (
              <TradeAlerts />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TradingTab;
