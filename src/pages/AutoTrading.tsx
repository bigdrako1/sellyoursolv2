
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AutoTradeSimple from "@/components/AutoTradeSimple";
import TokenAlertMonitor from "@/components/TokenAlertMonitor";
import TradeAlerts from "@/components/TradeAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { testHeliusConnection } from "@/utils/apiUtils";
import APP_CONFIG, { getActiveApiConfig } from "@/config/appDefinition";

const AutoTrading = () => {
  const [apiConnected, setApiConnected] = useState(true); // Default to true to prevent immediate warning
  const [apiConnectionChecked, setApiConnectionChecked] = useState(false);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const { toast } = useToast();
  const apiConfig = getActiveApiConfig();
  const environment = apiConfig.environment || 'development';

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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AutoTradeSimple />
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
