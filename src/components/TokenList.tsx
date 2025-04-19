
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown, Search, Star } from "lucide-react";

// Sample token data
const tokens = [
  { id: 1, name: "SolRunner", symbol: "SRUN", chain: "solana", price: 2.45, change24h: 12.3, volume24h: 1250000, marketCap: 24500000 },
  { id: 2, name: "BinanceX", symbol: "BNX", chain: "binance", price: 0.0458, change24h: -3.2, volume24h: 890000, marketCap: 5800000 },
  { id: 3, name: "AutoTrade", symbol: "AUTO", chain: "solana", price: 0.782, change24h: 5.4, volume24h: 650000, marketCap: 7900000 },
  { id: 4, name: "FrontBot", symbol: "FBOT", chain: "binance", price: 1.21, change24h: -0.8, volume24h: 420000, marketCap: 12400000 },
  { id: 5, name: "TradeX", symbol: "TDX", chain: "solana", price: 0.0034, change24h: 28.7, volume24h: 1760000, marketCap: 980000 },
];

const TokenList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  
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
                <TableHead className="text-gray-400">Chain</TableHead>
                <TableHead className="text-gray-400 text-right">Price</TableHead>
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${token.chain === 'solana' ? 'bg-solana' : 'bg-binance'}`}></div>
                      <span className="text-xs capitalize">{token.chain}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${token.price.toFixed(4)}</TableCell>
                  <TableCell className={`text-right ${token.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {token.change24h >= 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {Math.abs(token.change24h)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${(token.volume24h / 1000000).toFixed(2)}M</TableCell>
                  <TableCell className="text-right">${(token.marketCap / 1000000).toFixed(2)}M</TableCell>
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
