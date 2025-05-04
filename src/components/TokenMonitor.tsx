
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
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  
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
      }
    ];
    
    setTokens(mockTokens);
  }, []);
  
  const handleTradeToken = (token: Token) => {
    toast({
      title: "Trading Coming Soon",
      description: `Trade functionality for ${token.symbol} will be available soon`,
    });
  };
  
  const handleTrackToken = (token: Token) => {
    toast({
      title: "Token Tracked",
      description: `${token.symbol} has been added to your watchlist`,
    });
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
    </Card>
  );
};

export default TokenMonitor;
