import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Wallet, 
  Bot,
  AlertCircle,
  ExternalLink,
  BarChart,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { executeTrade, createTradingPosition, saveTradingPositions, loadTradingPositions } from "@/utils/tradingUtils";

interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  price: number;
  change24h: number;
  liquidity: number;
  marketCap: number | null;
  holders: number | null;
  quality: number;
  source: string;
  timestamp: string;
}

const TokenMonitor: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(0.1);
  const [trackingEnabled, setTrackingEnabled] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Load tokens (would fetch from API in a real implementation)
  useEffect(() => {
    const mockTokens: Token[] = [
      {
        id: "token1",
        name: "Alpha Runner",
        symbol: "ALPHA",
        address: "5qTnnb9UCVzpEErQNgcwi5seVjKc8kizNnWcmgxQt3Us",
        price: 0.00024,
        change24h: 35.2,
        liquidity: 56000,
        marketCap: 230000,
        holders: 125,
        quality: 85,
        source: "Smart Money",
        timestamp: new Date().toISOString()
      },
      {
        id: "token2",
        name: "Beta Token",
        symbol: "BETA",
        address: "BzhaNVx7WJBnJhoCFRqkHAWWNFxpy7cYeNCTZTdJFgge",
        price: 0.00012,
        change24h: 12.3,
        liquidity: 32000,
        marketCap: 120000,
        holders: 84,
        quality: 72,
        source: "Whale Activity",
        timestamp: new Date().toISOString()
      },
      {
        id: "token3",
        name: "Gamma Coin",
        symbol: "GAMMA",
        address: "5G811VMkkTKU4HTFQZURp5jcfZbD4LF2SGym5qQbviFN",
        price: 0.00341,
        change24h: -8.7,
        liquidity: 125000,
        marketCap: 450000,
        holders: 210,
        quality: 91,
        source: "Quality Token",
        timestamp: new Date().toISOString()
      }
    ];
    
    setTokens(mockTokens);
  }, []);
  
  const handleTradeToken = (token: Token) => {
    setSelectedToken(token);
    setTradeDialogOpen(true);
  };
  
  const handleTrackToken = (token: Token) => {
    toast(`${token.symbol} has been added to your watchlist`);
  };
  
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
            selectedToken.price,
            tradeAmount * 100, // Convert SOL to USD for simplicity
            selectedToken.source
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
  
  // Filter tokens based on active tab
  const filteredTokens = tokens.filter(token => {
    if (activeTab === "all") return true;
    if (activeTab === "smartMoney") return token.source === "Smart Money";
    if (activeTab === "whale") return token.source === "Whale Activity";
    if (activeTab === "quality") return token.quality >= 80;
    return true;
  });

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle>Token Monitor</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="smartMoney">Smart Money</TabsTrigger>
            <TabsTrigger value="whale">Whale Activity</TabsTrigger>
            <TabsTrigger value="quality">Quality Tokens</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="px-4 pb-4">
            {filteredTokens.length > 0 ? (
              <div className="space-y-3">
                {filteredTokens.map(token => (
                  <div key={token.id} className="p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{token.name}</span>
                        <span className="text-gray-400">${token.symbol}</span>
                        <Badge className="bg-trading-highlight">
                          {token.source}
                        </Badge>
                      </div>
                      <div className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <div className="text-gray-400">Price</div>
                        <div>${token.price.toFixed(6)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Liquidity</div>
                        <div>${token.liquidity.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Quality Score</div>
                        <div>{token.quality}/100</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTradeToken(token)}
                        className="bg-black/20 border-white/10"
                      >
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Trade
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTrackToken(token)}
                        className="bg-black/20 border-white/10"
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        Track
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://birdeye.so/token/${token.address}?chain=solana`, '_blank')}
                        className="bg-black/20 border-white/10"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-gray-400">No tokens detected yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  The system will automatically detect and display new tokens here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Trade Dialog */}
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
                    <div className="font-medium">${selectedToken.price.toFixed(8)}</div>
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
    </Card>
  );
};

export default TokenMonitor;
