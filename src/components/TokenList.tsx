
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getMarketOverview } from '@/utils/marketUtils';
import { formatCurrency } from '@/utils/marketUtils';
import { Search } from 'lucide-react';

const TokenList = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [marketOverview, setMarketOverview] = useState<any>(null);
  
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch market overview data for trending tokens and gainers/losers
        const overview = await getMarketOverview();
        
        if (overview) {
          setMarketOverview(overview);
          
          // Create a combined list of trending tokens
          if (overview.trending) {
            const trendingList = overview.trending.map((symbol: string) => ({
              symbol,
              name: getTokenName(symbol),
              price: 0, // We would fetch this in a real app
              change24h: getChange24h(symbol, overview),
              liquidity: 0,
              volume: 0,
              isTrending: true
            }));
            
            setTokens(trendingList);
          }
        }
      } catch (error) {
        console.error("Error fetching market data:", error);
      }
    };
    
    fetchMarketData();
  }, []);
  
  // Helper function to find token name based on symbol
  const getTokenName = (symbol: string): string => {
    const tokenNames: Record<string, string> = {
      SOL: "Solana",
      BONK: "Bonk",
      WIF: "Dogwifhat",
      JTO: "Jito",
      MEME: "Meme100",
      SAMO: "Samoyedcoin",
      PYTH: "Pyth Network",
      DAISY: "Daisy",
      RNDR: "Render Token"
    };
    
    return tokenNames[symbol] || symbol;
  };
  
  // Helper function to find change24h for a token
  const getChange24h = (symbol: string, overview: any): number => {
    // First check if it's in gainers
    if (overview.gainers) {
      const gainer = overview.gainers.find((g: any) => g.symbol === symbol);
      if (gainer) return gainer.change24h;
    }
    
    // Then check if it's in losers
    if (overview.losers) {
      const loser = overview.losers.find((l: any) => l.symbol === symbol);
      if (loser) return loser.change24h;
    }
    
    // Default to a random change
    return Math.random() * 20 - 5;
  };
  
  // Filter tokens based on search term
  const filteredTokens = tokens.filter(token => 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    token.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Token List</CardTitle>
        <div className="relative w-1/2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tokens..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/20">
              <tr className="text-xs text-gray-400">
                <th className="px-6 py-3 text-left">Token</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-right">24h</th>
                <th className="px-6 py-3 text-right">Liquidity</th>
                <th className="px-6 py-3 text-right">Volume</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="font-medium">{token.name}</div>
                          <div className="text-xs text-gray-400">${token.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      {formatCurrency(token.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={token.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                        {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {formatCurrency(token.liquidity || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {formatCurrency(token.volume || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {token.isTrending && (
                        <Badge className="bg-trading-highlight">Trending</Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No tokens found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenList;
