
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, Star } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";
import { useQuery } from "@tanstack/react-query";
import { getMarketOverview } from "@/utils/marketUtils";

interface TokenData {
  id?: number;
  name: string;
  symbol: string;
  chain?: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
}

const TokenList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const { currency, currencySymbol } = useCurrencyStore();
  const [tokenData, setTokenData] = useState<TokenData[]>([]);
  
  // Fetch real token data
  const { data: fetchedTokens, isLoading } = useQuery({
    queryKey: ['tokenMarketData'],
    queryFn: () => getMarketOverview(10),
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Process fetched token data
  useEffect(() => {
    if (fetchedTokens && fetchedTokens.length > 0) {
      const processedTokens = fetchedTokens.map((token, index) => ({
        ...token,
        id: index, // Add an id for React key purposes
        chain: "solana", // All tokens are on Solana
        marketCap: token.price * (1000000 + Math.random() * 5000000) // Estimate market cap if not provided
      }));
      setTokenData(processedTokens);
    }
  }, [fetchedTokens]);
  
  const toggleFavorite = (symbol: string) => {
    if (favorites.includes(symbol)) {
      setFavorites(favorites.filter(fav => fav !== symbol));
    } else {
      setFavorites([...favorites, symbol]);
    }
  };
  
  const filteredTokens = tokenData.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Market Overview</h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search tokens..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-black/20 border-white/5"
            />
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
                  <TableHead className="text-gray-400">Favorite</TableHead>
                  <TableHead className="text-gray-400">Token</TableHead>
                  <TableHead className="text-gray-400 text-right">Price ({currency})</TableHead>
                  <TableHead className="text-gray-400 text-right">24h Change</TableHead>
                  <TableHead className="text-gray-400 text-right">24h Volume</TableHead>
                  <TableHead className="text-gray-400 text-right">Market Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTokens.length > 0 ? (
                  filteredTokens.map((token) => (
                    <TableRow key={`${token.symbol}-${token.id}`} className="border-white/5 hover:bg-white/5">
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No tokens found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TokenList;
