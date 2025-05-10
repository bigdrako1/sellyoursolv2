
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Repeat } from 'lucide-react';
import LivePriceTracker from '@/components/LivePriceTracker';
import { testHeliusConnection } from '@/services/tokenDataService';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
import TokenTabContent from '@/components/trading/TokenTabContent';
import DetectorTabContent from '@/components/trading/DetectorTabContent';
import SmartMoneyTabContent from '@/components/trading/SmartMoneyTabContent';
import TelegramTabContent from '@/components/trading/TelegramTabContent';
import AnalyticsTabContent from '@/components/trading/AnalyticsTabContent';
import SentimentTabContent from '@/components/trading/SentimentTabContent';
import QualityTabContent from '@/components/trading/QualityTabContent';
import RunnersTabContent from '@/components/trading/RunnersTabContent';
import WatchlistTabContent from '@/components/trading/WatchlistTabContent';
import WebhooksTabContent from '@/components/trading/WebhooksTabContent';
import StrategyTabContent from '@/components/trading/StrategyTabContent';
import AlertsTabContent from '@/components/trading/AlertsTabContent';

const TradingTab = () => {
  const [activeTab, setActiveTab] = useState('monitor');
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
      ) : (
        <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-black/20 border-white/10 border overflow-x-auto flex-wrap">
            <TabsTrigger value="monitor">Token Monitor</TabsTrigger>
            <TabsTrigger value="detector">Token Detector</TabsTrigger>
            <TabsTrigger value="smartmoney">Smart Money</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
            <TabsTrigger value="quality">Quality Filter</TabsTrigger>
            <TabsTrigger value="runners">Potential Runners</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitor">
            {activeTab === 'monitor' && <TokenTabContent />}
          </TabsContent>
          
          <TabsContent value="detector">
            {activeTab === 'detector' && <DetectorTabContent />}
          </TabsContent>
          
          <TabsContent value="smartmoney">
            {activeTab === 'smartmoney' && <SmartMoneyTabContent />}
          </TabsContent>
          
          <TabsContent value="telegram">
            {activeTab === 'telegram' && <TelegramTabContent />}
          </TabsContent>
          
          <TabsContent value="analytics">
            {activeTab === 'analytics' && <AnalyticsTabContent />}
          </TabsContent>
          
          <TabsContent value="sentiment">
            {activeTab === 'sentiment' && <SentimentTabContent />}
          </TabsContent>
          
          <TabsContent value="quality">
            {activeTab === 'quality' && <QualityTabContent />}
          </TabsContent>
          
          <TabsContent value="runners">
            {activeTab === 'runners' && <RunnersTabContent />}
          </TabsContent>
          
          <TabsContent value="watchlist">
            {activeTab === 'watchlist' && <WatchlistTabContent />}
          </TabsContent>
          
          <TabsContent value="webhooks">
            {activeTab === 'webhooks' && <WebhooksTabContent />}
          </TabsContent>
          
          <TabsContent value="strategy">
            {activeTab === 'strategy' && <StrategyTabContent />}
          </TabsContent>
          
          <TabsContent value="alerts">
            {activeTab === 'alerts' && <AlertsTabContent />}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TradingTab;
