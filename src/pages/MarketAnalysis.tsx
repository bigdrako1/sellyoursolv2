
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { heliusApiCall, testHeliusConnection } from "@/utils/apiUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Activity, Wallet, Search } from "lucide-react";
import ApiUsageMonitor from "@/components/ApiUsageMonitor";
import LivePriceTracker from "@/components/LivePriceTracker";

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
}

const MarketAnalysis = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [topTokens, setTopTokens] = useState<TokenData[]>([]);
  const [systemLatency, setSystemLatency] = useState<number | null>(30); // Default latency value
  const { toast } = useToast();

  // Check API connection on mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const connected = await testHeliusConnection();
        setApiConnected(connected);
        if (!connected) {
          toast({
            title: "API Connection Failed",
            description: "Could not connect to Helius API. Some features may be limited.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("API connection test failed:", error);
        setApiConnected(false);
      }
    };
    
    checkApiConnection();
  }, [toast]);

  // Load mock data (in a real app, this would use heliusApiCall)
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be:
        // const data = await heliusApiCall<TokenData[]>('/tokens/market-data');
        
        // For demo, use mock data
        setTimeout(() => {
          const mockData: TokenData[] = [
            { name: "Solana", symbol: "SOL", price: 142.54, change24h: 3.2, volume24h: 1250000000 },
            { name: "Jupiter", symbol: "JUP", price: 1.23, change24h: -1.5, volume24h: 45000000 },
            { name: "Bonk", symbol: "BONK", price: 0.00002345, change24h: 12.8, volume24h: 34000000 },
            { name: "Raydium", symbol: "RAY", price: 1.67, change24h: 2.1, volume24h: 18000000 },
            { name: "Marinade", symbol: "MNDE", price: 0.41, change24h: -0.8, volume24h: 5200000 },
          ];
          setTopTokens(mockData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        toast({
          title: "Data Fetch Failed",
          description: "Could not load market data. Please try again later.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Market Analysis</h1>
        
        <div className="flex justify-between items-center mb-6">
          <LivePriceTracker />
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
                    <CardTitle>Top Tokens by Market Cap</CardTitle>
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
                        {topTokens.map((token) => (
                          <div key={token.symbol} className="flex items-center justify-between border-b border-gray-700 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-800 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                                {token.symbol.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-medium">{token.name}</div>
                                <div className="text-sm text-gray-400">{token.symbol}</div>
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
                        ))}
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
                    <p className="text-muted-foreground">
                      Market activity data from Helius API will be displayed here.
                      This panel would show recent transactions, volume spikes, and other on-chain metrics.
                    </p>
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
                    <p className="text-muted-foreground">
                      Search and explore detailed token information using the Helius API.
                      Enter a token symbol or address to view charts, stats and on-chain data.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <ApiUsageMonitor />
            
            <Card>
              <CardHeader>
                <CardTitle>API Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Provider</span>
                  <span className="font-medium">Helius</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`${apiConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {apiConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rate Limit</span>
                  <span className="font-medium">5 req/sec</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer systemActive={false} systemLatency={systemLatency} />
    </div>
  );
};

export default MarketAnalysis;
