
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Wallet, ExternalLink, LineChart, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SmartMoneyAlert {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  contractAddress: string;
  price: number;
  priceChange: number;
  liquidity: number;
  volume: number;
  timestamp: string;
  walletAddress?: string;
  transactionValue?: number;
  source: string;
}

const SmartMoneyAlerts = () => {
  const [alerts, setAlerts] = useState<SmartMoneyAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("recent");
  const { toast } = useToast();
  
  // Smart money wallets to track (example addresses, in production would be real known profitable traders)
  const smartMoneyWallets = [
    "3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9",
    "6Dkr4HJLo9XavxrJpsMcky2rKzKJP3wgpuP9mJbYekbV",
    "9AYmFnSdDDYEa5EaZJU8yCQmxpGwhEbgKU7SdeQDiEsZ"
  ];

  useEffect(() => {
    // Load alerts from localStorage on component mount
    const loadAlerts = () => {
      try {
        const storedAlerts = localStorage.getItem("smart_money_alerts");
        if (storedAlerts) {
          setAlerts(JSON.parse(storedAlerts));
        } else {
          // Mock data for demo purposes
          const mockAlerts: SmartMoneyAlert[] = [
            {
              id: "alert-1",
              tokenName: "Bonk",
              tokenSymbol: "BONK",
              contractAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
              price: 0.000023,
              priceChange: 12.5,
              liquidity: 1200000,
              volume: 85000000,
              timestamp: new Date(Date.now() - 25 * 60000).toISOString(), // 25 mins ago
              walletAddress: "3FTHyP7TLcqd6C969eGHQ2QfnpRFmfqbKA2MnzTcf3j9",
              transactionValue: 15000,
              source: "Smart Money Buying Now"
            },
            {
              id: "alert-2",
              tokenName: "MonkeyBucks",
              tokenSymbol: "MBS",
              contractAddress: "MBSbRQpZpU5u8VM9rnjZxkm8J7SUgQKU8nxfvfSEd5h",
              price: 0.0005234,
              priceChange: 45.3,
              liquidity: 520000,
              volume: 8500000,
              timestamp: new Date(Date.now() - 48 * 60000).toISOString(), // 48 mins ago
              walletAddress: "6Dkr4HJLo9XavxrJpsMcky2rKzKJP3wgpuP9mJbYekbV",
              transactionValue: 8900,
              source: "Smart Money Buying Now"
            },
            {
              id: "alert-3",
              tokenName: "Meme100",
              tokenSymbol: "MEME",
              contractAddress: "MEMEXQWzNMLG4t5UtUVqbXEhJSxssCwYVTT1dosXKz7",
              price: 0.000178,
              priceChange: 103.5,
              volume: 4300000,
              liquidity: 210000,
              timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hrs ago
              walletAddress: "9AYmFnSdDDYEa5EaZJU8yCQmxpGwhEbgKU7SdeQDiEsZ",
              transactionValue: 12500,
              source: "Smart Money Accumulating"
            }
          ];
          setAlerts(mockAlerts);
          localStorage.setItem("smart_money_alerts", JSON.stringify(mockAlerts));
        }
        setLoading(false);
      } catch (error) {
        console.error("Error loading smart money alerts:", error);
        setLoading(false);
      }
    };

    loadAlerts();
    
    // Set up periodic check for new alerts (in production, this would connect to a websocket)
    const intervalId = setInterval(() => {
      // Simulate receiving a new alert
      const randomChance = Math.random();
      if (randomChance > 0.85) { // 15% chance of new alert
        const newAlert = generateNewAlert();
        handleNewAlert(newAlert);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Generate a mock new alert (in production, this would come from API/websocket)
  const generateNewAlert = (): SmartMoneyAlert => {
    const tokens = [
      { name: "Daisy", symbol: "DAISY", address: "daiskPLEbNUvVq1k8bCrdo7r9SuCDNYJyXnj1FJP8", price: 0.00074, change: -3.1, liquidity: 450000, volume: 23000000 },
      { name: "Samoyedcoin", symbol: "SAMO", address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", price: 0.0234, change: 8.7, liquidity: 780000, volume: 19000000 },
      { name: "Jito", symbol: "JTO", address: "jtojtomepa8beP8AuQc6eXt5FriJwfnGz1Y6law3uE", price: 3.75, change: 1.2, liquidity: 920000, volume: 8900000 },
    ];
    
    const randomWallet = smartMoneyWallets[Math.floor(Math.random() * smartMoneyWallets.length)];
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    const txValue = Math.floor(Math.random() * 20000) + 5000;
    
    return {
      id: `alert-${Date.now()}`,
      tokenName: randomToken.name,
      tokenSymbol: randomToken.symbol,
      contractAddress: randomToken.address,
      price: randomToken.price,
      priceChange: randomToken.change,
      liquidity: randomToken.liquidity,
      volume: randomToken.volume,
      timestamp: new Date().toISOString(),
      walletAddress: randomWallet,
      transactionValue: txValue,
      source: Math.random() > 0.5 ? "Smart Money Buying Now" : "Smart Money Accumulating"
    };
  };
  
  // Handle new incoming alert
  const handleNewAlert = (newAlert: SmartMoneyAlert) => {
    setAlerts(prevAlerts => {
      // Add to the beginning of the array
      const updatedAlerts = [newAlert, ...prevAlerts];
      // Save to localStorage
      localStorage.setItem("smart_money_alerts", JSON.stringify(updatedAlerts));
      return updatedAlerts;
    });
    
    // Show toast notification
    toast({
      title: `Smart Money Alert: ${newAlert.tokenSymbol}`,
      description: `${newAlert.source} - $${newAlert.transactionValue.toLocaleString()}`,
      variant: "default"
    });
  };
  
  // Format timestamp to relative time
  const formatTime = (timestamp: string): string => {
    const alertTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - alertTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  
  const filteredAlerts = 
    activeTab === 'recent' ? alerts.slice(0, 10) :
    activeTab === 'high-value' ? alerts.filter(a => (a.transactionValue || 0) > 10000) :
    alerts;

  return (
    <Card className="card-with-border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-trading-highlight" />
            Smart Money Alerts
          </CardTitle>
          <Badge variant="outline" className="bg-trading-highlight/10 text-trading-highlight">
            {alerts.length} alerts
          </Badge>
        </div>
        <CardDescription>Whale wallet activity and smart money movements</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-3 bg-black/20">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="high-value">High Value</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="flex items-center gap-2">
              <span className="h-5 w-5 block rounded-full border-2 border-t-transparent border-trading-highlight animate-spin"></span>
              <span>Loading alerts...</span>
            </div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No alerts matching your filter</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredAlerts.map(alert => (
              <div key={alert.id} className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-trading-highlight/20 text-trading-highlight py-0.5">
                      {alert.source}
                    </Badge>
                    <span className="text-xs text-gray-400">{formatTime(alert.timestamp)}</span>
                  </div>
                  <div className={`text-xs font-medium ${alert.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {alert.priceChange >= 0 ? '+' : ''}{alert.priceChange}%
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">{alert.tokenName} ({alert.tokenSymbol})</h4>
                  <div className="text-sm font-mono">${alert.price.toFixed(alert.price < 0.01 ? 6 : 4)}</div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Wallet className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-mono text-gray-400">{alert.walletAddress?.substring(0, 4)}...{alert.walletAddress?.substring(alert.walletAddress.length - 4)}</span>
                  <ArrowUp className="h-3.5 w-3.5 text-green-400 rotate-45" />
                  <span className="text-green-400">${alert.transactionValue?.toLocaleString()}</span>
                </div>
                
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                  <div className="text-xs">
                    <span className="text-gray-400">Vol: </span>
                    <span>${(alert.volume / 1000000).toFixed(1)}M</span>
                    <span className="mx-2 text-gray-500">|</span>
                    <span className="text-gray-400">Liq: </span>
                    <span>${(alert.liquidity / 1000).toFixed(0)}K</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 bg-black/20 border-white/10">
                      <LineChart className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 px-2 bg-black/20 border-white/10"
                      onClick={() => window.open(`https://birdeye.so/token/${alert.contractAddress}?chain=solana`, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartMoneyAlerts;
