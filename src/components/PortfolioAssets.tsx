
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

// Generate sample assets data
const generateAssets = () => {
  const assets = [
    { name: "Solana", symbol: "SOL", type: "token", chain: "solana", balance: 14.8, price: 158.32, value: 2343.14, change24h: 9.8 },
    { name: "SOL Runner", symbol: "SRUN", type: "token", chain: "solana", balance: 2450, price: 0.243, value: 594.34, change24h: 3.2 },
    { name: "Binance Coin", symbol: "BNB", type: "token", chain: "binance", balance: 4.32, price: 354.26, value: 1530.40, change24h: 5.7 },
    { name: "Front Bot", symbol: "FBOT", type: "token", chain: "binance", balance: 1280, price: 0.28, value: 358.04, change24h: 7.1 },
    { name: "Trading X", symbol: "TDX", type: "token", chain: "solana", balance: 455, price: 0.34, value: 154.7, change24h: -2.3 },
    { name: "Auto", symbol: "AUTO", type: "token", chain: "solana", balance: 28.5, price: 16.73, value: 476.80, change24h: 1.8 },
    { name: "BNX", symbol: "BNX", type: "token", chain: "binance", balance: 10.4, price: 9.82, value: 102.13, change24h: -4.2 }
  ];

  // Sort by value descending
  return assets.sort((a, b) => b.value - a.value);
};

const PortfolioAssets = () => {
  const [assets] = useState(generateAssets());
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Apply filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = searchTerm === "" || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChain = filter === "all" || asset.chain === filter;
    
    return matchesSearch && matchesChain;
  });
  
  // Calculate total value
  const totalValue = filteredAssets.reduce((sum, asset) => sum + asset.value, 0);
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="font-bold text-lg">Portfolio Assets</h3>
          
          <div className="flex w-full sm:w-auto gap-2">
            <div className="relative w-full sm:w-64">
              <Input 
                placeholder="Search assets..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-black/20 border-white/10"
              />
              <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <Button variant="outline" size="icon" className="bg-trading-darkAccent border-white/10">
              <Filter size={16} />
            </Button>
            
            <Button variant="outline" size="icon" className="bg-trading-darkAccent border-white/10">
              <SlidersHorizontal size={16} />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filter === "all" ? "secondary" : "outline"} 
            size="sm" 
            className={filter !== "all" ? "bg-trading-darkAccent border-white/10" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button 
            variant={filter === "solana" ? "secondary" : "outline"} 
            size="sm" 
            className={filter !== "solana" ? "bg-trading-darkAccent border-white/10" : ""}
            onClick={() => setFilter("solana")}
          >
            Solana
          </Button>
          <Button 
            variant={filter === "binance" ? "secondary" : "outline"} 
            size="sm" 
            className={filter !== "binance" ? "bg-trading-darkAccent border-white/10" : ""}
            onClick={() => setFilter("binance")}
          >
            Binance
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-gray-400">Asset</TableHead>
                <TableHead className="text-gray-400">Chain</TableHead>
                <TableHead className="text-gray-400 text-right">Balance</TableHead>
                <TableHead className="text-gray-400 text-right">Price</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
                <TableHead className="text-gray-400 text-right">24h Change</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.symbol} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-xs text-gray-400">{asset.symbol}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${asset.chain === 'solana' ? 'bg-solana/20 text-solana-foreground' : 'bg-binance/20 text-binance-foreground'}`}>
                      {asset.chain === 'solana' ? 'Solana' : 'BSC'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{asset.balance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${asset.price.toFixed(asset.price < 1 ? 3 : 2)}</TableCell>
                  <TableCell className="text-right font-medium">${asset.value.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${asset.change24h >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-7 bg-trading-darkAccent border-white/10">Trade</Button>
                      <Button variant="outline" size="sm" className="h-7 bg-trading-darkAccent border-white/10">Details</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
          <div className="text-sm">
            Total Value: <span className="font-bold">${totalValue.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PortfolioAssets;
