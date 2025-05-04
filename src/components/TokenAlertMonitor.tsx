
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { playSound } from "@/utils/soundUtils";

interface Token {
  name: string;
  symbol: string;
  address: string;
  price: number;
  marketCap: number;
  liquidity: number;
  holders: number;
  qualityScore: number;
  source: string;
  createdAt: Date;
}

const mockTokens: Token[] = [
  {
    name: "SolRunner",
    symbol: "SRUN",
    address: "8iJ5VD4rivW8yBrJS5jiMG9YMxMJbPBu8QyqDNUYQP7G",
    price: 0.00034,
    marketCap: 250000,
    liquidity: 75000,
    holders: 120,
    qualityScore: 82,
    source: "Helius API",
    createdAt: new Date(new Date().getTime() - 45 * 60000)
  },
  {
    name: "MemeToken",
    symbol: "MEME",
    address: "6bTT8Dxs6D3zsiKVpVSfEecRMzHBzFxJcCiGxZpBZ3Sm",
    price: 0.00012,
    marketCap: 120000,
    liquidity: 30000,
    holders: 85,
    qualityScore: 65,
    source: "Smart Money Alert",
    createdAt: new Date(new Date().getTime() - 90 * 60000)
  }
];

const TokenAlertMonitor: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // In a real implementation, this would connect to a websocket or polling mechanism
    // to fetch new token alerts from Helius or other APIs
    setTokens(mockTokens);
    
    // Simulate getting a new token alert
    const timer = setTimeout(() => {
      if (alertsEnabled) {
        const newToken = {
          name: "AutoDegen",
          symbol: "AUTO",
          address: "3rTDyiQMDxBKrVu8EyHyfBbhQ5gHkVyMFbVWXuu5mPx1",
          price: 0.00056,
          marketCap: 320000,
          liquidity: 95000,
          holders: 145,
          qualityScore: 78,
          source: "Birdeye API",
          createdAt: new Date()
        };
        
        setTokens(prev => [newToken, ...prev]);
        
        // Play sound for the alert
        playSound('alert');
        
        toast({
          title: "New Token Detected",
          description: `${newToken.name} (${newToken.symbol}) has been launched`,
          variant: "default",
        });
      }
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [alertsEnabled, toast]);

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

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  };

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
        {tokens.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            No token alerts yet
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token, index) => (
              <Alert key={index} className="bg-trading-darkAccent border-l-4 border-l-trading-highlight">
                <div className="flex justify-between">
                  <div>
                    <AlertTitle className="flex items-center font-bold">
                      {token.name} ({token.symbol})
                      {index === 0 && <Badge className="ml-2 bg-red-500">NEW</Badge>}
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
                    <a 
                      href={`https://birdeye.so/token/${token.address}?chain=solana`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs flex items-center text-trading-highlight mt-2 hover:underline"
                    >
                      View <ArrowUpRight className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenAlertMonitor;
