import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Search, Star, AlertTriangle, Zap, Shield } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { useQuery } from "@tanstack/react-query";
import { getMarketOverview } from "@/utils/marketUtils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokenData {
  name: string;
  symbol: string;
  chain?: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  launchTime?: number; // Timestamp for token launch time
  liquidityScore?: number; // Score from 0-100 for liquidity health
  riskScore?: number; // Risk assessment score (higher = riskier)
  smartMoneyActivity?: number; // Smart money activity level (0-100)
}

const TokenList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [view, setView] = useState<"all" | "new" | "trending" | "smart">("all");
  const { currency, currencySymbol } = useCurrencyStore();
  
  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("token_favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (updatedFavorites: string[]) => {
    localStorage.setItem("token_favorites", JSON.stringify(updatedFavorites));
  };
  
  // Fetch real token data
  const { data: fetchedTokens, isLoading } = useQuery({
    queryKey: ['tokenMarketData', currency, view],
    queryFn: () => getMarketOverview(20),
    refetchInterval: 15000 // Refetch every 15 seconds for real-time insights
  });
  
  const toggleFavorite = (symbol: string) => {
    const updatedFavorites = favorites.includes(symbol) 
      ? favorites.filter(fav => fav !== symbol)
      : [...favorites, symbol];
    
    setFavorites(updatedFavorites);
    saveFavorites(updatedFavorites);
  };
  
  const filteredTokens = fetchedTokens ? 
    fetchedTokens.filter(token => 
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56,
      KES: 129.45
    };
    
    return value * (rates[currency as keyof typeof rates] || 1);
  };

  // Calculate how new a token is based on launch time
  const getTokenAge = (launchTime?: number): string => {
    if (!launchTime) return "Unknown";
    const now = Date.now();
    const diffHours = (now - launchTime) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "< 1h";
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    if (diffHours < 48) return "1d";
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d`;
    return "> 1w";
  };

  // Generate risk rating badge
  const getRiskBadge = (riskScore?: number) => {
    if (riskScore === undefined) return null;
    
    if (riskScore < 30) {
      return <Badge className="bg-green-600/80 hover:bg-green-600">Low Risk</Badge>;
    } else if (riskScore < 70) {
      return <Badge className="bg-amber-500/80 hover:bg-amber-500">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-600/80 hover:bg-red-600 flex items-center gap-1">
        <AlertTriangle size={12} />High Risk
      </Badge>;
    }
  };

  // Smart money indicator
  const getSmartMoneyIndicator = (level?: number) => {
    if (!level || level < 20) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${level > 70 ? 'text-trading-success' : 'text-trading-highlight'}`}>
              <Zap size={14} className="fill-current" />
              {level > 70 && <Shield size={14} />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            Smart money interest: {level}/100
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
          <h3 className="font-bold text-lg">Drako AI Token Detection</h3>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0 md:w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search tokens..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-black/20 border-white/5"
              />
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant={view === "all" ? "default" : "outline"} 
                onClick={() => setView("all")}
                className={view === "all" ? "bg-trading-highlight" : "bg-black/20"}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={view === "new" ? "default" : "outline"} 
                onClick={() => setView("new")}
                className={view === "new" ? "bg-trading-highlight" : "bg-black/20"}
              >
                New
              </Button>
              <Button 
                size="sm" 
                variant={view === "trending" ? "default" : "outline"} 
                onClick={() => setView("trending")}
                className={view === "trending" ? "bg-trading-highlight" : "bg-black/20"}
              >
                Trending
              </Button>
              <Button 
                size="sm" 
                variant={view === "smart" ? "default" : "outline"} 
                onClick={() => setView("smart")}
                className={view === "smart" ? "bg-trading-highlight" : "bg-black/20"}
              >
                Smart
              </Button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-gray-400 w-6"></TableHead>
                  <TableHead className="text-gray-400">Token</TableHead>
                  <TableHead className="text-gray-400 text-right">Price ({currency})</TableHead>
                  <TableHead className="text-gray-400 text-right">24h Change</TableHead>
                  <TableHead className="text-gray-400 text-right">24h Volume</TableHead>
                  <TableHead className="text-gray-400 text-right">Market Cap</TableHead>
                  <TableHead className="text-gray-400 text-right">Age</TableHead>
                  <TableHead className="text-gray-400 text-right">Risk</TableHead>
                  <TableHead className="text-gray-400 text-center w-6">AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token, index) => (
                    <TableRow key={`${token.symbol}-${index}`} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <button onClick={() => toggleFavorite(token.symbol)} className="focus:outline-none">
                          <Star className={`h-4 w-4 ${favorites.includes(token.symbol) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {token.symbol}
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </TableCell>
                      <TableCell className="text-right">{currencySymbol}{convertToCurrency(token.price).toFixed(4)}</TableCell>
                      <TableCell className={`text-right ${token.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {token.change24h >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          {Math.abs(token.change24h)}%
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{currencySymbol}{(convertToCurrency(token.volume24h) / 1000000).toFixed(2)}M</TableCell>
                      <TableCell className="text-right">{currencySymbol}{token.marketCap ? (convertToCurrency(token.marketCap) / 1000000).toFixed(2) : '0.00'}M</TableCell>
                      <TableCell className="text-right">
                        {getTokenAge(token.launchTime)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getRiskBadge(token.riskScore)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getSmartMoneyIndicator(token.smartMoneyActivity)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">No tokens found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        <div className="flex justify-between items-center mt-4 text-xs text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <Zap size={12} className="text-trading-highlight mr-1 fill-trading-highlight" />
              Smart Money
            </div>
            <div className="flex items-center">
              <AlertTriangle size={12} className="text-red-500 mr-1" />
              Risk Alert
            </div>
          </div>
          <div>
            Auto-refreshes every 15 seconds
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TokenList;
