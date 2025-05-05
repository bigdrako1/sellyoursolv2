
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Bell, BellOff, Loader2, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/utils/soundUtils";
import { getRecentTokenActivity, getTrendingTokens, getPumpFunTokens, tokenInfoToToken } from "@/services/tokenDataService";
import type { Token } from "@/types/token.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

const TokenAlertMonitor: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [pumpFunTokens, setPumpFunTokens] = useState<Token[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [pumpFunLoading, setPumpFunLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("alerts");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTokens = async () => {
      if (!alertsEnabled) return;
      
      setLoading(true);
      setErrorMessage(null);
      try {
        // Fetch real token data using our service
        const tokenActivity = await getRecentTokenActivity();
        
        if (tokenActivity && Array.isArray(tokenActivity) && tokenActivity.length > 0) {
          // Process token data
          const tokenData: Token[] = tokenActivity.map(token => tokenInfoToToken(token));
          
          setTokens(tokenData);
          
          // Play sound notification for new tokens
          if (tokenData.length > 0 && tokens.length > 0) {
            if (tokenData[0].address !== tokens[0].address) {
              playSound('alert');
            }
          }
        } else {
          // No tokens found or API error
          console.log("No token data returned from API");
          setErrorMessage("No token data found. Check API configuration.");
        }
      } catch (error) {
        console.error("Error fetching token alerts:", error);
        setErrorMessage(`Error fetching token data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
    
    // Set up polling for new tokens
    const intervalId = setInterval(fetchTokens, 60000);
    return () => clearInterval(intervalId);
  }, [alertsEnabled, tokens]);

  // Fetch trending tokens from multiple DEXes
  useEffect(() => {
    const fetchTrendingTokens = async () => {
      setTrendingLoading(true);
      try {
        const trending = await getTrendingTokens();
        console.log("Fetched trending tokens:", trending);
        
        if (trending && Array.isArray(trending)) {
          // Convert TokenInfo to Token
          const trendingTokenData = trending.map(token => tokenInfoToToken(token));
          setTrendingTokens(trendingTokenData);
        }
      } catch (error) {
        console.error("Error fetching trending tokens:", error);
      } finally {
        setTrendingLoading(false);
      }
    };
    
    fetchTrendingTokens();
    
    // Refresh trending tokens every 5 minutes
    const intervalId = setInterval(fetchTrendingTokens, 300000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch pump.fun tokens specifically
  useEffect(() => {
    const fetchPumpFunTokens = async () => {
      setPumpFunLoading(true);
      try {
        const pumpTokens = await getPumpFunTokens();
        console.log("Fetched pump.fun tokens:", pumpTokens);
        
        if (pumpTokens && Array.isArray(pumpTokens)) {
          // Convert TokenInfo to Token
          const pumpTokenData = pumpTokens.map(token => tokenInfoToToken(token));
          setPumpFunTokens(pumpTokenData);
        }
      } catch (error) {
        console.error("Error fetching pump.fun tokens:", error);
      } finally {
        setPumpFunLoading(false);
      }
    };
    
    fetchPumpFunTokens();
    
    // Refresh pump.fun tokens every 5 minutes
    const intervalId = setInterval(fetchPumpFunTokens, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    toast({
      title: alertsEnabled ? "Alerts Disabled" : "Alerts Enabled",
      description: alertsEnabled 
        ? "You will no longer receive token alerts" 
        : "You will now receive alerts for new tokens",
      variant: "default",
    });
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">High Quality</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good Quality</Badge>;
    return <Badge className="bg-orange-500">Medium Quality</Badge>;
  };

  const getTrendingBadge = (score: number | string[] = 1) => {
    // Handle both number and string[] types for trendingScore
    const scoreValue = Array.isArray(score) ? score.length : score;
    
    if (scoreValue >= 3) return <Badge className="bg-purple-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Hot</Badge>;
    if (scoreValue >= 2) return <Badge className="bg-blue-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Trending</Badge>;
    return <Badge className="bg-gray-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Active</Badge>;
  };

  const getPumpFunBadge = () => {
    return <Badge className="bg-pink-500 flex items-center gap-1">Pump.fun</Badge>;
  };

  const formatTimeAgo = (date: Date | string | undefined) => {
    if (!date) return "unknown";
    
    try {
      // Convert string dates to Date objects
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return "unknown";
      }
      
      const minutes = Math.floor((new Date().getTime() - dateObj.getTime()) / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
    } catch (error) {
      console.error("Error formatting time ago:", error);
      return "unknown";
    }
  };
  
  const handleViewToken = (address: string) => {
    window.open(`https://birdeye.so/token/${address}?chain=solana`, '_blank');
  };

  const handleSwapToken = (address: string) => {
    window.open(`https://jup.ag/swap/SOL-${address}`, '_blank');
  };
  
  const handlePumpFunView = (address: string) => {
    window.open(`https://pump.fun/token/${address}`, '_blank');
  };

  if (!isAuthenticated) {
    return (
      <Card className="card-with-border">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-2" />
          <h3 className="text-lg font-medium mb-1">Authentication Required</h3>
          <p className="text-sm text-gray-400 text-center">
            Please connect your wallet to access token alerts and monitoring features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-with-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Token Alerts</CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleAlerts}
          className={alertsEnabled ? "text-green-500" : "text-gray-500"}
          title={alertsEnabled ? "Disable alerts" : "Enable alerts"}
        >
          {alertsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="alerts">New Tokens</TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="pumpfun" className="flex items-center gap-1">
              <span className="text-pink-500">🎯</span>
              Pump.fun
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-trading-highlight animate-spin mb-2" />
                <p className="text-sm text-gray-400">Fetching token alerts...</p>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-sm text-red-400">{errorMessage}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAlertsEnabled(true)}
                  className="mt-4"
                >
                  Retry Connection
                </Button>
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                {alertsEnabled ? "No token alerts yet. Waiting for new activity..." : "Alerts are disabled"}
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token, index) => (
                  <Alert key={token.address} className={`bg-trading-darkAccent border-l-4 ${token.isPumpFun ? 'border-l-pink-500' : 'border-l-trading-highlight'}`}>
                    <div className="flex justify-between">
                      <div>
                        <AlertTitle className="flex items-center font-bold">
                          {token.name} ({token.symbol})
                          {index === 0 && <Badge className="ml-2 bg-red-500">NEW</Badge>}
                          {token.isPumpFun && <Badge className="ml-2 bg-pink-500">Pump.fun</Badge>}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          Price: ${token.price.toFixed(8)} | MC: ${token.marketCap.toLocaleString()}
                        </AlertDescription>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span className="mr-1">Source: {token.source}</span>
                          <span className="mx-2">•</span>
                          <span>{formatTimeAgo(token.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {getQualityBadge(token.qualityScore)}
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewToken(token.address)}
                            className="text-xs flex items-center text-blue-400 hover:underline"
                          >
                            Chart <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                          <button
                            onClick={() => handleSwapToken(token.address)}
                            className="text-xs flex items-center text-green-400 hover:underline"
                          >
                            Swap <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                          {token.isPumpFun && (
                            <button
                              onClick={() => handlePumpFunView(token.address)}
                              className="text-xs flex items-center text-pink-400 hover:underline"
                            >
                              Pump.fun <ArrowUpRight className="h-3 w-3 ml-1" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="trending">
            {trendingLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin mb-2" />
                <p className="text-sm text-gray-400">Fetching trending tokens from DEXes...</p>
              </div>
            ) : trendingTokens.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                No trending tokens found. Please try again later.
              </div>
            ) : (
              <div className="space-y-4">
                {trendingTokens.map((token) => (
                  <Alert key={token.address} className="bg-gray-800 border-l-4 border-l-purple-500">
                    <div className="flex justify-between">
                      <div>
                        <AlertTitle className="flex items-center font-bold gap-2">
                          {token.name} ({token.symbol})
                          {getTrendingBadge(token.trendingScore)}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          Price: ${token.price.toFixed(token.price < 0.01 ? 8 : 4)} 
                          {token.change24h !== undefined && (
                            <span className={token.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                              {" "}({token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%)
                            </span>
                          )}
                        </AlertDescription>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span className="mr-1">Sources: {token.source}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleViewToken(token.address)}
                            className="text-xs flex items-center text-blue-400 hover:underline"
                          >
                            Chart <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                          <button
                            onClick={() => handleSwapToken(token.address)}
                            className="text-xs flex items-center text-green-400 hover:underline"
                          >
                            Swap <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="pumpfun">
            {pumpFunLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-pink-500 animate-spin mb-2" />
                <p className="text-sm text-gray-400">Fetching Pump.fun tokens...</p>
              </div>
            ) : pumpFunTokens.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                No Pump.fun tokens found. Please try again later.
              </div>
            ) : (
              <div className="space-y-4">
                {pumpFunTokens.map((token) => (
                  <Alert key={token.address} className="bg-gray-800 border-l-4 border-l-pink-500">
                    <div className="flex justify-between">
                      <div>
                        <AlertTitle className="flex items-center font-bold gap-2">
                          {token.name} ({token.symbol})
                          {getPumpFunBadge()}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">
                          Price: ${token.price.toFixed(token.price < 0.01 ? 8 : 4)} 
                          {token.change24h !== undefined && (
                            <span className={token.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                              {" "}({token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%)
                            </span>
                          )}
                        </AlertDescription>
                        <div className="flex items-center mt-1 text-xs text-gray-400">
                          <span className="mr-1">Source: Pump.fun</span>
                          {token.createdAt && <span className="mx-2">•</span>}
                          {token.createdAt && <span>{formatTimeAgo(token.createdAt)}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handlePumpFunView(token.address)}
                            className="text-xs flex items-center text-pink-400 hover:underline"
                          >
                            Pump.fun <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                          <button
                            onClick={() => handleViewToken(token.address)}
                            className="text-xs flex items-center text-blue-400 hover:underline"
                          >
                            Chart <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                          <button
                            onClick={() => handleSwapToken(token.address)}
                            className="text-xs flex items-center text-green-400 hover:underline"
                          >
                            Swap <ArrowUpRight className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TokenAlertMonitor;
