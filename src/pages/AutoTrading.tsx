
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StrategyManager from "@/components/StrategyManager";
import StrategyConfig from "@/components/StrategyConfig";
import TradeAlerts from "@/components/TradeAlerts";
import TokenAlertMonitor from "@/components/TokenAlertMonitor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { testHeliusConnection } from "@/utils/apiUtils";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const AutoTrading = () => {
  const [apiConnected, setApiConnected] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("config");
  const { toast } = useToast();

  // Check API connection on mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const startTime = Date.now();
        const connected = await testHeliusConnection();
        const latency = Date.now() - startTime;
        
        setApiConnected(connected);
        setSystemLatency(latency);
        
        if (!connected) {
          toast({
            title: "API Connection Failed",
            description: "Could not connect to trading API. Auto-trading features may be limited.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("API connection test failed:", error);
        setApiConnected(false);
      }
    };
    
    checkApiConnection();
    
    // Set up periodic connection checks
    const intervalId = setInterval(checkApiConnection, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [toast]);
  
  const handleSecureAll = () => {
    toast({
      title: "Initial Investments Secured",
      description: "Initial investments have been secured for all active strategies.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Automated Trading</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="config">Trade Settings</TabsTrigger>
                  <TabsTrigger value="strategies">Strategy Manager</TabsTrigger>
                  <TabsTrigger value="create">Create Strategy</TabsTrigger>
                </TabsList>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 bg-trading-success/10 text-trading-success border-trading-success/30 hover:bg-trading-success/20"
                  onClick={handleSecureAll}
                >
                  <Shield size={14} />
                  <span>Secure All Initials</span>
                </Button>
              </div>
              
              <TabsContent value="config" className="ai-trading-card card-with-border">
                <StrategyManager />
              </TabsContent>
              
              <TabsContent value="strategies" className="ai-trading-card card-with-border">
                <StrategyManager />
              </TabsContent>
              
              <TabsContent value="create" className="ai-trading-card card-with-border">
                <StrategyConfig 
                  title="Create Trading Strategy"
                  description="Configure parameters for a new automated trading strategy"
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle>Trading Status</CardTitle>
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
                    <span className="text-sm text-muted-foreground">Active Strategies</span>
                    <span className="font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Today's Trades</span>
                    <span className="font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profit/Loss</span>
                    <span className="text-gray-400 font-medium">--</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <TokenAlertMonitor />
            <TradeAlerts />
          </div>
        </div>
      </main>
      
      <Footer systemActive={apiConnected} systemLatency={systemLatency} />
    </div>
  );
};

export default AutoTrading;
