
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StrategyManager from "@/components/StrategyManager";
import StrategyConfig from "@/components/StrategyConfig";
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
              <TabsList className="mb-4">
                <TabsTrigger value="config">Trade Settings</TabsTrigger>
                <TabsTrigger value="strategies">Strategy Manager</TabsTrigger>
                <TabsTrigger value="create">Create Strategy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="config" className="ai-trading-card card-with-border">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 bg-trading-success/10 text-trading-success border-trading-success/30"
                    onClick={handleSecureAll}
                  >
                    <Shield size={14} />
                    <span>Secure All Initials</span>
                  </Button>
                </div>
                
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
                    <span className="font-medium">2</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Today's Trades</span>
                    <span className="font-medium">8</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Profit/Loss</span>
                    <span className="text-green-500 font-medium">+2.34%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-with-border">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-2 bg-trading-darkAccent/50 rounded">
                    <p className="text-sm text-yellow-400">Strategy "SOL Momentum" triggered buy signal</p>
                    <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                  </div>
                  
                  <div className="p-2 bg-trading-darkAccent/50 rounded">
                    <p className="text-sm text-green-400">Limit order executed: +0.5 SOL</p>
                    <p className="text-xs text-gray-400 mt-1">43 minutes ago</p>
                  </div>
                  
                  <div className="p-2 bg-trading-darkAccent/50 rounded">
                    <p className="text-sm text-red-400">Stop-loss triggered for BONK position</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer systemActive={apiConnected} systemLatency={systemLatency} />
    </div>
  );
};

export default AutoTrading;
