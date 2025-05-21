import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Wallet,
  Bot,
  AlertCircle,
  ExternalLink,
  BarChart,
  Check,
  Loader2,
  Bell,
  BellOff,
  ArrowUpRight,
  Zap,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TokenDetailsView } from "@/components/token";
import { Slider } from "@/components/ui/slider";
import { executeTrade, createTradingPosition, saveTradingPositions, loadTradingPositions } from "@/utils/tradingUtils";
import { playSound } from "@/utils/soundUtils";
import { getRecentTokenActivity, getTrendingTokens, getPumpFunTokens, tokenInfoToToken } from "@/services/tokenDataService";
import { getQualitySummary, getRiskEmoji, getRunnerPotentialGrade } from "@/services/tokenMonitorService";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Token interface representing a cryptocurrency token
 */
interface Token {
  id?: string;
  name: string;
  symbol: string;
  address: string;
  price?: number;
  change24h?: number;
  liquidity?: number;
  marketCap?: number | null;
  holders?: number | null;
  quality?: number;
  qualityScore?: number;
  source?: string;
  timestamp?: string;
  createdAt?: string | Date;
  smartMoneyScore?: number;
  runnerPotential?: string;
  trendingScore?: number | string[];
  isPumpFun?: boolean;
}

interface TokenTrackerProps {
  /** Title for the component */
  title?: string;
  /** Whether to show alerts tab */
  showAlerts?: boolean;
  /** Whether to show trending tab */
  showTrending?: boolean;
  /** Whether to show pump.fun tab */
  showPumpFun?: boolean;
  /** Whether to enable trading functionality */
  enableTrading?: boolean;
  /** Optional class name for styling */
  className?: string;
  /** Optional callback when a token is selected */
  onTokenSelected?: (token: Token) => void;
}

/**
 * TokenTracker component - consolidated from TokenMonitor and TokenAlertMonitor
 * Provides functionality to track and monitor token activity
 */
const TokenTracker: React.FC<TokenTrackerProps> = ({
  title = "Token Monitor",
  showAlerts = true,
  showTrending = true,
  showPumpFun = true,
  enableTrading = true,
  className = "",
  onTokenSelected
}) => {
  // State
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<Token[]>([]);
  const [pumpFunTokens, setPumpFunTokens] = useState<Token[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [pumpFunLoading, setPumpFunLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load tokens (would fetch from API in a real implementation)
  useEffect(() => {
    if (!showAlerts) return;

    const fetchTokens = async () => {
      if (!alertsEnabled) return;

      setLoading(true);
      setErrorMessage(null);
      try {
        // Fetch real token data using our service
        const tokenActivity = await getRecentTokenActivity();

        if (tokenActivity && Array.isArray(tokenActivity) && tokenActivity.length > 0) {
          // Process token data
          const tokenData: Token[] = tokenActivity.map(token => {
            const processedToken = tokenInfoToToken(token);

            // Calculate runner potential if quality score exists
            if (processedToken.qualityScore) {
              processedToken.runnerPotential = getRunnerPotentialGrade(processedToken.qualityScore);
            }

            return processedToken;
          });

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
  }, [alertsEnabled, tokens, showAlerts]);

  // Fetch trending tokens
  useEffect(() => {
    if (!showTrending) return;

    const fetchTrendingTokens = async () => {
      setTrendingLoading(true);
      try {
        const trending = await getTrendingTokens();

        if (trending && Array.isArray(trending)) {
          // Convert TokenInfo to Token
          const trendingTokenData = trending.map(token => {
            const processedToken = tokenInfoToToken(token);

            // Calculate runner potential if quality score exists
            if (processedToken.qualityScore) {
              processedToken.runnerPotential = getRunnerPotentialGrade(processedToken.qualityScore);
            }

            return processedToken;
          });
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
  }, [showTrending]);

  // Fetch pump.fun tokens
  useEffect(() => {
    if (!showPumpFun) return;

    const fetchPumpFunTokens = async () => {
      setPumpFunLoading(true);
      try {
        const pumpTokens = await getPumpFunTokens();

        if (pumpTokens && Array.isArray(pumpTokens)) {
          // Convert TokenInfo to Token
          const pumpTokenData = pumpTokens.map(token => {
            const processedToken = tokenInfoToToken(token);
            processedToken.isPumpFun = true;

            // Calculate runner potential if quality score exists
            if (processedToken.qualityScore) {
              processedToken.runnerPotential = getRunnerPotentialGrade(processedToken.qualityScore);
            }

            return processedToken;
          });
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
  }, [showPumpFun]);

  // Toggle alerts
  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    toast(
      alertsEnabled ? "Alerts Disabled" : "Alerts Enabled",
      {
        description: alertsEnabled
          ? "You will no longer receive token alerts"
          : "You will now receive alerts for new tokens"
      }
    );
  };

  // Handle token selection
  const handleTradeToken = (token: Token) => {
    setSelectedToken(token);

    if (onTokenSelected) {
      onTokenSelected(token);
    }

    if (enableTrading) {
      setTradeDialogOpen(true);
    }
  };

  // Handle token tracking
  const handleTrackToken = (token: Token) => {
    toast(`${token.symbol} has been added to your watchlist`);
  };

  // Execute trade
  const handleExecuteTrade = async () => {
    if (!selectedToken) return;

    setIsProcessing(true);

    try {
      // Execute trade using internal system
      const result = await executeTrade(
        selectedToken.address,
        tradeAmount
      );

      if (result.success) {
        // Create a position if tracking is enabled
        if (trackingEnabled) {
          const newPosition = createTradingPosition(
            selectedToken.address,
            selectedToken.name,
            selectedToken.symbol,
            selectedToken.price || 0,
            tradeAmount * 100, // Convert SOL to USD for simplicity
            selectedToken.source || "Unknown"
          );

          toast(`Successfully added ${selectedToken.symbol} to your portfolio`);
        }

        // Close dialog and show success
        setTradeDialogOpen(false);

        toast(`Purchased ${selectedToken.symbol} for ${tradeAmount} SOL`);
      } else {
        toast.error(result.error || "There was an error executing your trade. Please try again.");
      }
    } catch (error) {
      console.error("Trade execution error:", error);
      toast.error("There was an unexpected error executing your trade. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const getQualityBadge = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <Badge className="bg-green-500">High Quality</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Good Quality</Badge>;
    return <Badge className="bg-orange-500">Medium Quality</Badge>;
  };

  const getRunnerPotentialBadge = (potential?: string) => {
    if (!potential) return null;

    switch (potential) {
      case "Very High":
        return <Badge className="bg-purple-500 flex items-center gap-1"><Zap className="h-3 w-3" /> Very High</Badge>;
      case "High":
        return <Badge className="bg-blue-500 flex items-center gap-1"><Zap className="h-3 w-3" /> High</Badge>;
      case "Medium":
        return <Badge className="bg-cyan-500 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Medium</Badge>;
      case "Low":
        return <Badge className="bg-yellow-500 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Low</Badge>;
      default:
        return <Badge className="bg-gray-500 flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Very Low</Badge>;
    }
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

  // View token details
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>("");
  const [isTokenDetailsOpen, setIsTokenDetailsOpen] = useState(false);

  // View token details
  const handleViewToken = (address: string) => {
    setSelectedTokenAddress(address);
    setIsTokenDetailsOpen(true);
  };

  // View token on pump.fun
  const handlePumpFunView = (address: string) => {
    window.open(`https://pump.fun/token/${address}`, '_blank');
  };

  // Close token details
  const handleCloseTokenDetails = () => {
    setIsTokenDetailsOpen(false);
  };

  // Filter tokens based on active tab
  const filteredTokens = tokens.filter(token => {
    if (activeTab === "all") return true;
    if (activeTab === "smartMoney") return token.source === "Smart Money";
    if (activeTab === "whale") return token.source === "Whale Activity";
    if (activeTab === "quality") return (token.quality || token.qualityScore || 0) >= 80;
    return true;
  });

  // Authentication check
  if (showAlerts && !isAuthenticated) {
    return (
      <Card className={`card-with-border ${className}`}>
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
    <Card className={`card-with-border ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>{title}</CardTitle>
        {showAlerts && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAlerts}
            className={alertsEnabled ? "text-green-500" : "text-gray-500"}
            title={alertsEnabled ? "Disable alerts" : "Enable alerts"}
          >
            {alertsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${showPumpFun ? 4 : showTrending ? 3 : 2}, 1fr)` }}>
            <TabsTrigger value="all">All</TabsTrigger>
            {showAlerts && <TabsTrigger value="alerts">Alerts</TabsTrigger>}
            {showTrending && <TabsTrigger value="trending">Trending</TabsTrigger>}
            {showPumpFun && <TabsTrigger value="pumpfun">Pump.fun</TabsTrigger>}
          </TabsList>

          <TabsContent value="all" className="px-4 pb-4">
            {/* All tokens view */}
          </TabsContent>

          <TabsContent value="alerts" className="px-4 pb-4">
            {/* Alerts view */}
          </TabsContent>

          <TabsContent value="trending" className="px-4 pb-4">
            {/* Trending view */}
          </TabsContent>

          <TabsContent value="pumpfun" className="px-4 pb-4">
            {/* Pump.fun view */}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Trade Dialog */}
      {enableTrading && (
        <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-gray-900">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trade {selectedToken?.symbol}
              </DialogTitle>
            </DialogHeader>

            {selectedToken && (
              <div className="space-y-4 py-2">
                <div className="bg-black/20 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Token</div>
                      <div className="font-medium">{selectedToken.name} (${selectedToken.symbol})</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className="font-medium">${selectedToken.price?.toFixed(8) || "N/A"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeAmount">Trade Amount (SOL)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="tradeAmount"
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(Number(e.target.value))}
                      className="bg-black/20 border-white/10"
                      min={0.01}
                      step={0.01}
                    />
                    <Badge className="bg-gray-800 border-white/5">SOL</Badge>
                  </div>
                  <Slider
                    defaultValue={[0.1]}
                    value={[tradeAmount]}
                    onValueChange={([value]) => setTradeAmount(value)}
                    max={1}
                    min={0.01}
                    step={0.01}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.01 SOL</span>
                    <span>0.25 SOL</span>
                    <span>0.5 SOL</span>
                    <span>1 SOL</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                  <div className="text-sm text-gray-300">Track position</div>
                  <input
                    type="checkbox"
                    checked={trackingEnabled}
                    onChange={(e) => setTrackingEnabled(e.target.checked)}
                    className="toggle"
                  />
                </div>

                <div className="bg-blue-500/10 text-blue-300 p-3 rounded-lg text-xs space-y-2">
                  <p className="flex gap-2 items-center">
                    <BarChart size={14} />
                    <span>Trading with internal routing for optimal execution</span>
                  </p>
                  <p className="flex gap-2 items-center">
                    <Bot size={14} />
                    <span>Auto-secure initial investment at 2X profit</span>
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTradeDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteTrade}
                disabled={isProcessing || tradeAmount <= 0}
                className="relative"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Confirm Trade
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Token Details View */}
      <TokenDetailsView
        tokenAddress={selectedTokenAddress}
        isOpen={isTokenDetailsOpen}
        onClose={handleCloseTokenDetails}
        onTrade={handleTradeToken}
      />
    </Card>
  );
};

export default TokenTracker;
