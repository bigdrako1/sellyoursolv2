import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTradingStore } from '@/store/tradingStore';
import { useUserPreferencesStore } from '@/store/userPreferencesStore';
import { TradingPosition } from '@/types/token.types';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import { getJupiterSwapLink } from '@/utils/tradingUtils';
import PnLCard from '@/components/PnLCard';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  X
} from 'lucide-react';

const TradingPositions: React.FC = () => {
  const { 
    positions, 
    activePositions, 
    closedPositions, 
    loadPositions, 
    updatePosition, 
    closePosition 
  } = useTradingStore();
  
  const { tradingPreferences } = useUserPreferencesStore();
  
  const [selectedPosition, setSelectedPosition] = useState<TradingPosition | null>(null);
  const [showPnLCard, setShowPnLCard] = useState(false);
  
  // Load positions on mount
  useEffect(() => {
    loadPositions();
    
    // Set up interval to update positions
    const interval = setInterval(() => {
      activePositions.forEach(position => {
        // In a real app, we'd fetch the current price from an API
        // For now, simulate price changes
        const randomChange = (Math.random() - 0.45) * 0.05; // Slightly biased upward
        const newPrice = position.currentPrice * (1 + randomChange);
        updatePosition(position, newPrice);
      });
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadPositions, activePositions, updatePosition]);
  
  // Handle closing a position
  const handleClosePosition = (position: TradingPosition) => {
    closePosition(position.contractAddress, position.currentPrice);
    
    // Show PnL card if enabled in preferences
    if (tradingPreferences.showPnLCard) {
      setSelectedPosition(position);
      setShowPnLCard(true);
    }
  };
  
  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };
  
  return (
    <>
      <div className="space-y-6">
        {/* Active Positions */}
        <Card className="card-with-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activePositions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No active positions</p>
                <p className="text-sm mt-1">Your active trading positions will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activePositions.map((position) => {
                  const isProfitable = position.currentPrice > position.entryPrice;
                  const profitPercent = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
                  
                  return (
                    <div key={position.contractAddress} className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">${position.tokenSymbol}</h3>
                            <Badge variant={isProfitable ? "success" : "destructive"} className="text-xs">
                              {isProfitable ? '+' : ''}{formatPercent(profitPercent)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{position.tokenName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 bg-black/30"
                            onClick={() => window.open(getJupiterSwapLink(position.contractAddress), '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Jupiter
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-7 px-2 bg-black/30"
                            onClick={() => handleClosePosition(position)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Close
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Entry Price</p>
                          <p className="font-medium">{formatCurrency(position.entryPrice)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Current Price</p>
                          <p className="font-medium">{formatCurrency(position.currentPrice)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Investment</p>
                          <p className="font-medium">{formatCurrency(position.initialInvestment)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Current Value</p>
                          <p className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(position.currentAmount)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Opened {formatTimeAgo(position.entryTime)}</span>
                        </div>
                        
                        {position.securedInitial && (
                          <div className="flex items-center gap-1 text-green-500">
                            <Shield className="h-3 w-3" />
                            <span>Initial secured</span>
                          </div>
                        )}
                        
                        {position.scaleOutHistory.length > 0 && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>{position.scaleOutHistory.length} scale-outs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Closed Positions */}
        <Card className="card-with-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Closed Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {closedPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No closed positions</p>
                <p className="text-sm mt-1">Your trading history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {closedPositions.map((position) => {
                  const isProfitable = position.pnl > 0;
                  
                  return (
                    <div key={position.contractAddress} className="bg-black/20 p-4 rounded-lg border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">${position.tokenSymbol}</h3>
                            <Badge variant={isProfitable ? "success" : "destructive"} className="text-xs">
                              {isProfitable ? '+' : ''}{formatPercent(position.roi)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">{position.tokenName}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 px-2 bg-black/30"
                          onClick={() => {
                            setSelectedPosition(position);
                            setShowPnLCard(true);
                          }}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          View PnL
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Entry Price</p>
                          <p className="font-medium">{formatCurrency(position.entryPrice)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Exit Price</p>
                          <p className="font-medium">{formatCurrency(position.currentPrice)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">Investment</p>
                          <p className="font-medium">{formatCurrency(position.initialInvestment)}</p>
                        </div>
                        <div className="bg-black/30 p-2 rounded">
                          <p className="text-xs text-gray-400">PnL</p>
                          <p className={`font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfitable ? '+' : ''}{formatCurrency(position.pnl)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Closed {formatTimeAgo(position.lastUpdateTime)}</span>
                        </div>
                        
                        {position.scaleOutHistory.length > 0 && (
                          <div className="flex items-center gap-1 text-blue-500">
                            <TrendingUp className="h-3 w-3" />
                            <span>{position.scaleOutHistory.length} scale-outs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* PnL Card Modal */}
      {showPnLCard && selectedPosition && (
        <PnLCard 
          position={selectedPosition} 
          onClose={() => setShowPnLCard(false)} 
        />
      )}
    </>
  );
};

export default TradingPositions;
