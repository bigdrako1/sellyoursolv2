
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradeAlerts from '@/components/TradeAlerts';
import TokenMonitor from '@/components/TokenMonitor';
import TokenDetector from '@/components/TokenDetector';
import StrategyManager from '@/components/StrategyManager';
import ApiUsageMonitor from '@/components/ApiUsageMonitor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, LineChart, Bell } from 'lucide-react';
import TokenList from '@/components/TokenList';
import { identifyPotentialRunners } from '@/utils/tradingUtils';
import LivePriceTracker from '@/components/LivePriceTracker';
import TwitterSentimentScanner from '@/components/TwitterSentimentScanner';
import TokenQualityFilter from '@/components/TokenQualityFilter';
import PotentialRunnersDetector from '@/components/PotentialRunnersDetector';
import TokenWatchlist from '@/components/TokenWatchlist';
import WebhookMonitor from '@/components/WebhookMonitor';
import TradingAnalyticsDashboard from '@/components/TradingAnalyticsDashboard';
import HeliusSetup from '@/components/HeliusSetup';
import { useToast } from '@/hooks/use-toast';

const TradingTab = () => {
  const [activeTab, setActiveTab] = useState('monitor');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const { toast } = useToast();
  
  // Check if Helius API key is already set
  useEffect(() => {
    const storedApiKey = localStorage.getItem('helius_api_key');
    if (storedApiKey) {
      setApiKeyConfigured(true);
    }
  }, []);
  
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
  
  const handleApiKeySet = (apiKey: string) => {
    if (apiKey) {
      setApiKeyConfigured(true);
      toast({
        title: "API Key Configured",
        description: "Your Helius API key has been set up successfully.",
      });
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
            v2.0
          </Badge>
        </div>
      </div>
      
      {!apiKeyConfigured && (
        <HeliusSetup onApiKeySet={handleApiKeySet} />
      )}
      
      <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-black/20 border-white/10 border">
          <TabsTrigger value="monitor">Token Monitor</TabsTrigger>
          <TabsTrigger value="detector">Token Detector</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="quality">Quality Filter</TabsTrigger>
          <TabsTrigger value="runners">Potential Runners</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
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
              <ApiUsageMonitor />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="detector" className="space-y-4">
          {activeTab === 'detector' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <TokenDetector />
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {activeTab === 'analytics' && (
            <TradingAnalyticsDashboard />
          )}
        </TabsContent>
        
        <TabsContent value="sentiment" className="space-y-4">
          {activeTab === 'sentiment' && (
            <TwitterSentimentScanner />
          )}
        </TabsContent>
        
        <TabsContent value="quality" className="space-y-4">
          {activeTab === 'quality' && (
            <TokenQualityFilter />
          )}
        </TabsContent>
        
        <TabsContent value="runners" className="space-y-4">
          {activeTab === 'runners' && (
            <PotentialRunnersDetector />
          )}
        </TabsContent>
        
        <TabsContent value="watchlist" className="space-y-4">
          {activeTab === 'watchlist' && (
            <TokenWatchlist />
          )}
        </TabsContent>
        
        <TabsContent value="webhooks" className="space-y-4">
          {activeTab === 'webhooks' && (
            <WebhookMonitor />
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
    </div>
  );
};

export default TradingTab;
