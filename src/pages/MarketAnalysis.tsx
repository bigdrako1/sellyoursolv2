
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { testHeliusConnection } from "@/utils/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Activity, Wallet, Search } from "lucide-react";
import LivePriceTracker from "@/components/LivePriceTracker";
import { getTrendingTokens } from "@/utils/marketUtils";

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  source?: string;
}

const MarketAnalysis = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(true); // Default to true to prevent immediate warning
  const [apiConnectionChecked, setApiConnectionChecked] = useState(false);
  const [topTokens, setTopTokens] = useState<TokenData[]>([]);
  const [systemLatency, setSystemLatency] = useState<number | null>(null);
  const { toast } = useToast();

  // Check API connection on mount
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
              description: "Successfully connected to Helius API.",
              variant: "default",
            });
          } else {
            toast({
              title: "API Connection Lost",
              description: "Connection to Helius API has been lost. Some features may be limited.",
              variant: "destructive",
            });
          }
        } else if (!apiConnectionChecked && !connected) {
          // Only show disconnection toast on first load
          toast({
            title: "API Connection Failed",
            description: "Could not connect to Helius API. Some features may be limited.",
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
            description: "Connection to Helius API has been lost. Some features may be limited.",
            variant: "destructive",
          });
        }

        setApiConnected(false);
        setApiConnectionChecked(true);
      }
    };

    checkApiConnection();

    // Set up periodic connection checks with a longer interval to prevent excessive API calls
    const intervalId = setInterval(checkApiConnection, 120000); // Check every 2 minutes

    return () => clearInterval(intervalId);
  }, [toast, apiConnected, apiConnectionChecked]);

  // Load real trending token data
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching trending tokens...");
        // Use the getTrendingTokens function to get trending tokens from all Solana DEXs
        const trendingTokens = await getTrendingTokens(10);
        console.log("Fetched trending tokens:", trendingTokens);
        setTopTokens(trendingTokens);
      } catch (error) {
        console.error("Failed to fetch trending tokens:", error);
        toast({
          title: "Data Fetch Failed",
          description: "Could not load trending token data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingTokens();

    // Set up refresh interval - less frequent to avoid rate limit issues
    const intervalId = setInterval(() => {
      fetchTrendingTokens();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, [toast]);

  // Service status color indicator function
  const getStatusColorClass = (isConnected: boolean) => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Market Analysis</h1>

        <div className="flex justify-end mb-6">
          <div className="flex items-center">
            <span className={`inline-flex h-2 w-2 rounded-full mr-2 ${apiConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm">{apiConnected ? 'API Connected' : 'API Disconnected'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">
                  <BarChart className="h-4 w-4 mr-2" />
                  Market Overview
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Activity className="h-4 w-4 mr-2" />
                  Recent Activity
                </TabsTrigger>
                <TabsTrigger value="tokens">
                  <Wallet className="h-4 w-4 mr-2" />
                  Token Explorer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <span className="text-purple-400 mr-2">Trending Solana Tokens</span>
                      <span className="bg-purple-500/20 text-xs rounded-full px-2 py-0.5 text-purple-300">
                        Live Data
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-12 mt-1" />
                              </div>
                            </div>
                            <div className="text-right">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16 mt-1" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {topTokens.length > 0 ? (
                          topTokens.map((token, index) => (
                            <div key={`${token.symbol}-${index}`} className="flex items-center justify-between border-b border-gray-700 pb-3">
                              <div className="flex items-center gap-2">
                                <div className={`bg-gradient-to-br from-purple-500/30 to-blue-500/30 h-10 w-10 rounded-full flex items-center justify-center font-bold border border-purple-500/20`}>
                                  {token.symbol.slice(0, 1)}
                                </div>
                                <div>
                                  <div className="font-medium">{token.name}</div>
                                  <div className="text-sm text-gray-400">
                                    {token.symbol} {token.source && <span className="text-xs text-purple-300">• {token.source}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div>${token.price.toLocaleString(undefined, {
                                  minimumFractionDigits: token.price < 0.01 ? 8 : 2,
                                  maximumFractionDigits: token.price < 0.01 ? 8 : 2
                                })}</div>
                                <div className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-400">
                            No trending token data available
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Market Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Activity className="h-12 w-12 mb-3 opacity-30" />
                      <p>Market activity data will be displayed here</p>
                      <p className="text-sm mt-1">Connect to Helius API to view on-chain metrics</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tokens">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Explorer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md"
                        placeholder="Search for a token..."
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Wallet className="h-12 w-12 mb-3 opacity-30" />
                      <p>Enter a token address to search</p>
                      <p className="text-sm mt-1">Token data will be loaded from connected APIs</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="font-medium text-purple-400">Helius</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`${apiConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {apiConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Latency</span>
                  <span className="font-medium">{systemLatency ? `${systemLatency}ms` : 'Measuring...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rate Limit</span>
                  <span className="font-medium">5 req/sec</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connected Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Personal API Key</span>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded">For authentication and rate limits</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Solana RPC</span>
                  <span className={`inline-block w-3 h-3 rounded-full ${getStatusColorClass(apiConnected)}`}></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Helius API</span>
                  <span className={`inline-block w-3 h-3 rounded-full ${getStatusColorClass(apiConnected)}`}></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Webhooks</span>
                  <span className={`inline-block w-3 h-3 rounded-full ${getStatusColorClass(false)}`}></span>
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

export default MarketAnalysis;
