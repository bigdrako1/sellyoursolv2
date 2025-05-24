
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Activity, TrendingUp, DollarSign, PieChart, LineChart, RefreshCw } from "lucide-react";
import { getTrendingTokens } from "@/utils/marketUtils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  source?: string;
}

interface MarketMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  dominanceSOL: number;
  activeTokens: number;
  topGainer: TokenData | null;
  topLoser: TokenData | null;
}

const MarketAnalysis = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [topTokens, setTopTokens] = useState<TokenData[]>([]);
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics>({
    totalMarketCap: 0,
    totalVolume24h: 0,
    dominanceSOL: 0,
    activeTokens: 0,
    topGainer: null,
    topLoser: null
  });

  // Load market data
  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch trending tokens
      const tokens = await getTrendingTokens();
      setTopTokens(tokens);

      // Calculate market metrics
      if (tokens.length > 0) {
        const totalVolume = tokens.reduce((sum, token) => sum + token.volume24h, 0);
        const totalMarketCap = tokens.reduce((sum, token) => sum + (token.marketCap || 0), 0);

        const sortedByChange = [...tokens].sort((a, b) => b.change24h - a.change24h);
        const topGainer = sortedByChange[0];
        const topLoser = sortedByChange[sortedByChange.length - 1];

        setMarketMetrics({
          totalMarketCap,
          totalVolume24h: totalVolume,
          dominanceSOL: 65.2, // Mock data
          activeTokens: tokens.length,
          topGainer,
          topLoser
        });
      }
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Quick Actions handlers
  const handleViewAllTokens = () => {
    navigate('/tokens');
  };

  const handleAdvancedAnalytics = () => {
    navigate('/portfolio');
    toast.success('Navigating to Portfolio Analytics');
  };

  const handleSetPriceAlerts = () => {
    navigate('/auto-trading');
    toast.success('Navigating to Trading Alerts Configuration');
  };

  // Enhanced refresh with user feedback
  const handleRefreshData = async () => {
    try {
      await loadMarketData();
      toast.success('Market data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh market data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Market Analysis</h1>
          <p className="text-gray-400 mt-1">Real-time Solana ecosystem market data and insights</p>
        </div>
        <Button
          onClick={handleRefreshData}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Market Cap</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(marketMetrics.totalMarketCap)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">24h Volume</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(marketMetrics.totalVolume24h)}
                </p>
              </div>
              <BarChart className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">SOL Dominance</p>
                <p className="text-2xl font-bold text-white">{marketMetrics.dominanceSOL}%</p>
              </div>
              <PieChart className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-trading-darkAccent border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Tokens</p>
                <p className="text-2xl font-bold text-white">{marketMetrics.activeTokens}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="trending" className="space-y-6">
            <TabsList className="bg-trading-darkAccent border-white/10">
              <TabsTrigger value="trending">
                <TrendingUp className="h-4 w-4 mr-2" />
                Trending Tokens
              </TabsTrigger>
              <TabsTrigger value="gainers">
                <LineChart className="h-4 w-4 mr-2" />
                Top Gainers/Losers
              </TabsTrigger>
              <TabsTrigger value="volume">
                <BarChart className="h-4 w-4 mr-2" />
                Volume Leaders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trending" className="space-y-4">
              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                    Trending Solana Tokens
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Live</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-700 rounded-full animate-pulse" />
                            <div>
                              <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                              <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mt-1" />
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                            <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mt-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topTokens.length > 0 ? (
                        topTokens.map((token, index) => (
                          <div key={`${token.symbol}-${index}`} className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-purple-500/30 to-blue-500/30 h-10 w-10 rounded-full flex items-center justify-center font-bold border border-purple-500/20">
                                {token.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-white">{token.name}</div>
                                <div className="text-sm text-gray-400">
                                  {token.symbol} {token.source && <span className="text-xs text-purple-300">• {token.source}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">
                                ${token.price.toLocaleString(undefined, {
                                  minimumFractionDigits: token.price < 0.01 ? 8 : 2,
                                  maximumFractionDigits: token.price < 0.01 ? 8 : 2
                                })}
                              </div>
                              <div className={`text-sm font-medium ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>No trending token data available</p>
                          <p className="text-sm mt-1">Market data will appear here when available</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gainers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Gainer */}
                <Card className="bg-trading-darkAccent border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                      Top Gainer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketMetrics.topGainer ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500/20 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                            {marketMetrics.topGainer.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{marketMetrics.topGainer.name}</div>
                            <div className="text-sm text-gray-400">{marketMetrics.topGainer.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">${marketMetrics.topGainer.price.toFixed(6)}</div>
                          <div className="text-green-400 font-medium">+{marketMetrics.topGainer.change24h.toFixed(2)}%</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Loser */}
                <Card className="bg-trading-darkAccent border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-red-400 rotate-180" />
                      Top Loser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {marketMetrics.topLoser ? (
                      <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-500/20 h-10 w-10 rounded-full flex items-center justify-center font-bold">
                            {marketMetrics.topLoser.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-white">{marketMetrics.topLoser.name}</div>
                            <div className="text-sm text-gray-400">{marketMetrics.topLoser.symbol}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">${marketMetrics.topLoser.price.toFixed(6)}</div>
                          <div className="text-red-400 font-medium">{marketMetrics.topLoser.change24h.toFixed(2)}%</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">No data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <Card className="bg-trading-darkAccent border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-400" />
                    Volume Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topTokens
                      .sort((a, b) => b.volume24h - a.volume24h)
                      .slice(0, 5)
                      .map((token, index) => (
                        <div key={`volume-${token.symbol}-${index}`} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-white">{token.name}</div>
                              <div className="text-sm text-gray-400">{token.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-medium">{formatCurrency(token.volume24h)}</div>
                            <div className="text-sm text-gray-400">24h Volume</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Market Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Market Status</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Last Updated</span>
                <span className="text-sm text-white">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Data Source</span>
                <span className="text-sm text-white">Multiple APIs</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full bg-trading-highlight hover:bg-trading-highlight/80"
                onClick={handleViewAllTokens}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View All Tokens
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black/20 border-white/10 text-white hover:bg-white/10"
                onClick={handleAdvancedAnalytics}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Advanced Analytics
              </Button>
              <Button
                variant="outline"
                className="w-full bg-black/20 border-white/10 text-white hover:bg-white/10"
                onClick={handleSetPriceAlerts}
              >
                <Activity className="h-4 w-4 mr-2" />
                Set Price Alerts
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketAnalysis;
