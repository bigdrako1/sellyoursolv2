
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, Star } from "lucide-react";
import { useCurrencyStore } from "@/store/currencyStore";

// Sample token data
const tokens = [
  { id: 1, name: "SellYourSOL", symbol: "SELL", price: 2.45, change24h: 12.3, volume24h: 1250000, marketCap: 24500000 },
  { id: 3, name: "AutoTrade", symbol: "AUTO", chain: "solana", price: 0.782, change24h: 5.4, volume24h: 650000, marketCap: 7900000 },
  { id: 5, name: "TradeX", symbol: "TDX", chain: "solana", price: 0.0034, change24h: 28.7, volume24h: 1760000, marketCap: 980000 },
  { id: 6, name: "Solana", symbol: "SOL", chain: "solana", price: 142.50, change24h: 3.2, volume24h: 8760000, marketCap: 59800000 },
  { id: 7, name: "Jupiter", symbol: "JUP", chain: "solana", price: 0.79, change24h: -2.1, volume24h: 3260000, marketCap: 8700000 },
];

const TokenList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const { currency, currencySymbol } = useCurrencyStore();
  
  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };
  
  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert USD values to the selected currency
  const convertToCurrency = (value: number): number => {
    const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 150.56
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
              {filteredTokens.map((token) => (
                <TableRow key={token.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <button onClick={() => toggleFavorite(token.id)} className="focus:outline-none">
                      <Star className={`h-4 w-4 ${favorites.includes(token.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
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
                  <TableCell className="text-right">{currencySymbol}{(convertToCurrency(token.marketCap) / 1000000).toFixed(2)}M</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

export default TokenList;
