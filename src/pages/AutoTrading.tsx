
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { testHeliusConnection } from "@/utils/apiUtils";
import APP_CONFIG, { getActiveApiConfig } from "@/config/appDefinition";
import TradingStrategy from "@/components/TradingStrategy";
import TokenMonitor from "@/components/TokenMonitor";
import WalletMonitor from "@/components/WalletMonitor";
import TradeAlerts from "@/components/TradeAlerts";
import HeliusSetup from "@/components/HeliusSetup";
import AutoTradeSimple from "@/components/AutoTradeSimple";
import StrategyManager from "@/components/StrategyManager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, TrendingUp, Bell } from "lucide-react";

const AutoTrading = () => {
  const [apiConnected, setApiConnected] = useState(true); // Default to true to prevent immediate warning
  const [apiConnectionChecked, setApiConnectionChecked] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const { toast } = useToast();
  const apiConfig = getActiveApiConfig();
  const environment = apiConfig.environment || 'development';

  // Check if Helius API key is already set
  useEffect(() => {
    const storedApiKey = localStorage.getItem('helius_api_key');
    if (storedApiKey) {
      setApiKeyConfigured(true);
    }
  }, []);

  // Handle API key configuration
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
  
  // Check API connection on mount and periodically
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const startTime = Date.now();
        const connected = await testHeliusConnection();
        const latency = Date.now() - startTime;
        
        if (apiConnectionChecked && connected !== apiConnected) {
          // Only show toast when status changes after initial check
          if (connected) {
            toast({
              title: "API Connection Restored",
              description: `Successfully connected to trading API (${environment}).`,
              variant: "default",
            });
          } else {
            toast({
              title: "API Connection Lost",
              description: `Connection to trading API (${environment}) has been lost. Some features may be limited.`,
              variant: "destructive",
            });
          }
        } else if (!apiConnectionChecked && !connected) {
          // Only show disconnection toast on first load
          toast({
            title: "API Connection Failed",
            description: `Could not connect to trading API (${environment}). Auto-trading features may be limited.`,
            variant: "destructive",
          });
        }
        
        setApiConnected(connected);
        setApiConnectionChecked(true);
        setSystemLatency(latency);
      } catch (error) {
        console.error("API connection test failed:", error);
        
        if (apiConnected) {
          // Only show toast when going from connected to disconnected
          toast({
            title: "API Connection Lost",
            description: `Connection to trading API (${environment}) has been lost. Some features may be limited.`,
            variant: "destructive",
          });
        }
        
        setApiConnected(false);
        setApiConnectionChecked(true);
      }
    };
    
    checkApiConnection();
    
    // Set up periodic connection checks
    const intervalId = setInterval(checkApiConnection, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [toast, apiConnected, apiConnectionChecked, environment]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Automated Trading</h1>
        
        {!apiKeyConfigured && (
          <div className="mb-6">
            <HeliusSetup onApiKeySet={handleApiKeySet} />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-black/20 border-white/10 border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TradingStrategy />
                <TokenMonitor />
              </div>
              
              <div className="space-y-6">
                <Card className="card-with-border">
                  <CardHeader>
                    <CardTitle>Trading Status <span className="text-xs font-normal text-gray-400">({environment})</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">API Status</span>
                        <span className={`${apiConnected ? 'text-green-500' : 'text-red-500'} font-medium flex items-center`}>
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {apiConnected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Latency</span>
                        <span className="font-medium">{systemLatency ? `${systemLatency}ms` : 'Measuring...'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Positions</span>
                        <span className="font-medium">0</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Today's Trades</span>
                        <span className="font-medium">0</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Profit/Loss</span>
                        <span className="text-gray-400 font-medium">-</span>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setActiveTab("configuration")}
                        >
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Configure Trading
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <WalletMonitor />
                <TradeAlerts />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="configuration">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AutoTradeSimple />
              </div>
              
              <div className="space-y-6">
                <Card className="card-with-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Risk Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400">
                        Our automated trading system employs sophisticated risk management strategies to protect your capital
                        while maximizing potential returns.
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Key Risk Features:</h4>
                        <ul className="text-xs space-y-1">
                          <li className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-green-400" />
                            <span>Auto-secure initial investment at 100% profit</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-green-400" />
                            <span>Automated stop-loss protection</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-green-400" />
                            <span>Advanced token quality filtering</span>
                          </li>
                          <li className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 text-green-400" />
                            <span>Position size management</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="pt-4">
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => setActiveTab("strategies")}
                        >
                          <Bell className="mr-2 h-4 w-4" />
                          View Trading Strategies
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <TradeAlerts />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="strategies">
            <StrategyManager />
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer systemActive={apiConnected} systemLatency={systemLatency} />
    </div>
  );
};

export default AutoTrading;
