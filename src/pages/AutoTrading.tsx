import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/services/toastService";
import { testHeliusConnection } from "@/utils/apiUtils";
import { getActiveApiConfig } from "@/config/appDefinition";
import { TokenTracker } from "@/components/token";
import { WalletTracker } from "@/components/wallet";
import { TradeAlerts } from "@/components/alerts";
import AutoTradeSimple from "@/components/AutoTradeSimple";
import { StrategyManager } from "@/components/trading";
import SmartMoneyAlerts from "@/components/smart-money/SmartMoneyAlerts";
import TelegramChannelMonitor from "@/components/TelegramChannelMonitor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, TrendingUp, Bell, Wallet, MessageSquare, Activity } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Link } from "react-router-dom";

const AutoTrading = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const apiConfig = getActiveApiConfig();
  const environment = apiConfig.environment || 'development';

  // Use our global state
  const {
    isConnected,
    systemLatency,
    setConnected,
    setSystemLatency
  } = useAppStore();

  const [apiConnectionChecked, setApiConnectionChecked] = useState(false);

  // Check API connection on mount and periodically
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const startTime = Date.now();
        const connected = await testHeliusConnection();
        const latency = Date.now() - startTime;

        if (apiConnectionChecked && connected !== isConnected) {
          // Only show toast when status changes after initial check
          if (connected) {
            toast.success(`Successfully connected to trading API (${environment}).`);
          } else {
            toast.error(`Connection to trading API (${environment}) has been lost. Some features may be limited.`);
          }
        } else if (!apiConnectionChecked && !connected) {
          // Only show disconnection toast on first load
          toast.error(`Could not connect to trading API (${environment}). Auto-trading features may be limited.`);
        }

        setConnected(connected);
        setApiConnectionChecked(true);
        setSystemLatency(latency);
      } catch (error) {
        console.error("API connection test failed:", error);

        if (isConnected) {
          // Only show toast when going from connected to disconnected
          toast.error(`Connection to trading API (${environment}) has been lost. Some features may be limited.`);
        }

        setConnected(false);
        setApiConnectionChecked(true);
      }
    };

    checkApiConnection();

    // Set up periodic connection checks
    const intervalId = setInterval(checkApiConnection, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isConnected, apiConnectionChecked, environment, setConnected, setSystemLatency]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Automated Trading</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/20 border-white/10 border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="smart-money">Smart Money</TabsTrigger>
          <TabsTrigger value="telegram">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TokenTracker />
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
                      <span className={`${isConnected ? 'text-green-500' : 'text-red-500'} font-medium flex items-center`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {isConnected ? 'Connected' : 'Disconnected'}
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

              <WalletTracker />
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

        <TabsContent value="smart-money">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SmartMoneyAlerts />
            </div>

            <div className="space-y-6">
              <Card className="card-with-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-400" />
                    Smart Money Wallets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Smart Money wallets are addresses of known profitable traders on Solana.
                    The system tracks their activities to provide early signals.
                  </p>

                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                      <div className="font-mono text-sm">3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9</div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-green-400">Success Rate: 88%</span>
                        <span>ROI: +324%</span>
                      </div>
                    </div>

                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                      <div className="font-mono text-sm">6Dkr4HJLo9XavxrJpsMcky2rKzKJP3wgpuP9mJbYekbV</div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-green-400">Success Rate: 76%</span>
                        <span>ROI: +215%</span>
                      </div>
                    </div>

                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                      <div className="font-mono text-sm">9AYmFnSdDDYEa5EaZJU8yCQmxpGwhEbgKU7SdeQDiEsZ</div>
                      <div className="mt-1 flex justify-between text-xs">
                        <span className="text-green-400">Success Rate: 92%</span>
                        <span>ROI: +471%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Link to="/wallet-tracking">
                      <Button className="w-full">
                        <Wallet className="h-4 w-4 mr-2" />
                        Wallet Tracking
                      </Button>
                    </Link>

                    <Button variant="outline" className="w-full bg-black/20 border-white/10">
                      <Bell className="h-4 w-4 mr-2" />
                      Add Custom Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <TradeAlerts />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="telegram">
          <TelegramChannelMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoTrading;
