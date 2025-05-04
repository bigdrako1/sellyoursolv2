
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, PlusCircle, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatchedToken {
  id: string;
  symbol: string;
  name: string;
  address: string;
  addedAt: string;
  lastPrice?: number;
  priceChange?: number;
}

const TokenWatchlist = () => {
  const [watchedTokens, setWatchedTokens] = useState<WatchedToken[]>([
    {
      id: '1',
      symbol: 'SOL',
      name: 'Solana',
      address: '0x123...456',
      addedAt: new Date().toISOString(),
      lastPrice: 138.45,
      priceChange: 2.3
    },
    {
      id: '2',
      symbol: 'BONK',
      name: 'Bonk',
      address: '0xabc...def',
      addedAt: new Date().toISOString(),
      lastPrice: 0.00001234,
      priceChange: -1.2
    }
  ]);
  
  const [newToken, setNewToken] = useState('');
  const [isWatching, setIsWatching] = useState(true);
  const { toast } = useToast();
  
  const handleAddToken = () => {
    if (!newToken) return;
    
    // In a real implementation, we would validate the token address and fetch token details
    const mockNewToken: WatchedToken = {
      id: Date.now().toString(),
      symbol: newToken.slice(0, 4).toUpperCase(),
      name: `Token ${newToken.slice(0, 6)}`,
      address: newToken,
      addedAt: new Date().toISOString(),
      lastPrice: Math.random() * 10,
      priceChange: (Math.random() * 10) - 5
    };
    
    setWatchedTokens(prev => [...prev, mockNewToken]);
    setNewToken('');
    
    toast({
      title: "Token added to watchlist",
      description: `${mockNewToken.symbol} has been added to your watchlist.`
    });
  };
  
  const handleRemoveToken = (id: string) => {
    setWatchedTokens(prev => prev.filter(token => token.id !== id));
    
    toast({
      title: "Token removed",
      description: "Token has been removed from your watchlist."
    });
  };
  
  const toggleWatching = () => {
    setIsWatching(!isWatching);
    
    toast({
      title: isWatching ? "Watchlist paused" : "Watchlist active",
      description: isWatching 
        ? "Token price updates have been paused." 
        : "Token prices will now be updated in real-time."
    });
  };
  
  return (
    <Card className="bg-trading-darkAccent border-trading-highlight/20">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Token Watchlist</CardTitle>
          <CardDescription>Track tokens of interest and receive price alerts</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleWatching}
          className={`${isWatching ? 'bg-trading-success/20 text-trading-success' : 'bg-trading-danger/20 text-trading-danger'} border-white/10`}
        >
          {isWatching ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Enter token address or symbol"
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            className="bg-trading-dark border-trading-highlight/30"
          />
          <Button
            onClick={handleAddToken}
            disabled={!newToken}
            className="bg-trading-highlight hover:bg-trading-highlight/80 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        
        {watchedTokens.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p>No tokens in your watchlist</p>
            <p className="text-sm mt-2">Add tokens to start tracking them</p>
          </div>
        ) : (
          <div className="space-y-2">
            {watchedTokens.map((token) => (
              <div 
                key={token.id} 
                className="flex items-center justify-between p-3 bg-trading-dark/50 rounded-md border border-trading-highlight/10 hover:border-trading-highlight/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {token.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium flex items-center">
                      {token.symbol}
                      <Badge 
                        variant="outline" 
                        className="ml-2 text-xs py-0 h-5 bg-trading-dark border-trading-highlight/20"
                      >
                        {token.name}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[200px]">
                      {token.address}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {token.lastPrice && (
                    <div className="text-right mr-4">
                      <div className="font-medium">${token.lastPrice.toFixed(token.lastPrice < 0.01 ? 8 : 4)}</div>
                      <div className={`text-xs ${token.priceChange && token.priceChange >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
                        {token.priceChange && token.priceChange >= 0 ? '+' : ''}{token.priceChange?.toFixed(2)}%
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveToken(token.id)}
                      className="h-8 w-8 p-0 hover:bg-trading-danger/20 hover:text-trading-danger"
                    >
                      <Trash2 size={14} />
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

export default TokenWatchlist;
