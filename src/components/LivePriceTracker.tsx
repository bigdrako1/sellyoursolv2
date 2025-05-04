
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSolPrice, getToken24hChange } from '@/utils/apiUtils';
import { formatCurrency } from '@/utils/marketUtils';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { useCurrencyStore } from '@/store/currencyStore';

const LivePriceTracker = () => {
  const { currency, currencySymbol } = useCurrencyStore();
  const [animatePrice, setAnimatePrice] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null);
  
  // Use React Query to fetch the SOL price
  const { 
    data: solPrice, 
    isLoading: solLoading, 
    error: solError 
  } = useQuery({
    queryKey: ['solPrice'],
    queryFn: getSolPrice,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Use React Query to fetch the 24h change
  const { 
    data: sol24hChange, 
    isLoading: changeLoading, 
    error: changeError 
  } = useQuery({
    queryKey: ['sol24hChange'],
    queryFn: () => getToken24hChange('SOL'),
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Handle price animation
  useEffect(() => {
    let lastPrice = 0;
    
    if (solPrice && lastPrice !== 0) {
      if (solPrice > lastPrice) {
        setPriceDirection('up');
      } else if (solPrice < lastPrice) {
        setPriceDirection('down');
      }
      
      setAnimatePrice(true);
      const timer = setTimeout(() => setAnimatePrice(false), 2000);
      return () => clearTimeout(timer);
    }
    
    lastPrice = solPrice || 0;
  }, [solPrice]);
  
  // Convert SOL price to selected currency
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
  
  // Display loading state
  if (solLoading || changeLoading) {
    return (
      <Card className="trading-card min-h-[72px] flex items-center justify-center">
        <CardContent className="p-3">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Loading price data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Display error state
  if (solError || changeError) {
    return (
      <Card className="trading-card min-h-[72px] border border-trading-danger/30">
        <CardContent className="p-3">
          <div className="text-xs text-trading-danger text-center">
            Failed to load price data
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="trading-card card-with-border">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">SOL Price</div>
            <div className={`text-lg font-bold ${animatePrice ? (priceDirection === 'up' ? 'text-trading-success' : 'text-trading-danger') : ''}`}>
              {currencySymbol}{solPrice ? convertToCurrency(solPrice).toFixed(2) : '-.--'}
            </div>
          </div>
          
          {sol24hChange !== undefined && (
            <div className={`flex items-center ${sol24hChange >= 0 ? 'text-trading-success' : 'text-trading-danger'}`}>
              {sol24hChange >= 0 ? (
                <ArrowUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 mr-1" />
              )}
              <span className="text-sm font-medium">
                {Math.abs(sol24hChange).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LivePriceTracker;
