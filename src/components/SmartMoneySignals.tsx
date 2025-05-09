
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { TradingSignal } from "@/services/smartMoneyAnalysisService";
import { toast } from "sonner";

// Mock signals for development
const SAMPLE_SIGNALS: TradingSignal[] = [
  {
    tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    tokenSymbol: "USDC",
    tokenName: "USD Coin",
    signalType: "buy",
    confidence: 92,
    detectedAt: new Date(Date.now() - 1800000).toISOString(),
    detectionSource: "wallet",
    sourceAddress: "B8oMRGgLETGQcksXBawvTDXvr5NLKX1jsBL2bAhXHyQT",
    predictedMovement: 15,
    timeFrame: "short"
  },
  {
    tokenAddress: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    tokenSymbol: "WIF",
    tokenName: "Dogwifhat",
    signalType: "sell",
    confidence: 78,
    detectedAt: new Date(Date.now() - 3600000).toISOString(),
    detectionSource: "pattern",
    predictedMovement: -8,
    timeFrame: "medium"
  },
  {
    tokenAddress: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    tokenSymbol: "BONK",
    tokenName: "Bonk",
    signalType: "watch",
    confidence: 85,
    detectedAt: new Date(Date.now() - 7200000).toISOString(),
    detectionSource: "ai",
    predictedMovement: 12,
    timeFrame: "medium"
  }
];

const SmartMoneySignals: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>(SAMPLE_SIGNALS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch signals from an API
    setLoading(true);
    setTimeout(() => {
      setSignals(SAMPLE_SIGNALS);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTradeClick = (signal: TradingSignal) => {
    // In a real app, this would open a trading dialog or create a position
    toast.success(`Trading ${signal.signalType === 'buy' ? 'buy' : 'sell'} signal`, {
      description: `${signal.tokenName} (${signal.tokenSymbol}) - ${signal.confidence}% confidence`
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'wallet':
        return <Wallet className="h-3 w-3" />;
      case 'pattern':
        return <TrendingUp className="h-3 w-3" />;
      case 'ai':
        return <Brain className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getSignalBadge = (signal: TradingSignal) => {
    switch (signal.signalType) {
      case 'buy':
        return <Badge className="bg-green-600">Buy</Badge>;
      case 'sell':
        return <Badge className="bg-red-600">Sell</Badge>;
      case 'watch':
        return <Badge className="bg-blue-600">Watch</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Brain className="h-4 w-4 text-blue-400" />
          Smart Money Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : signals.length > 0 ? (
            signals.map((signal) => (
              <div
                key={`${signal.tokenAddress}-${signal.signalType}-${signal.detectedAt}`}
                className="bg-black/20 p-3 rounded-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {getSignalBadge(signal)}
                      <span className="font-medium">{signal.tokenSymbol}</span>
                      <Badge
                        variant="outline"
                        className="bg-blue-900/30 border-blue-500/50 text-blue-300"
                      >
                        {signal.confidence}% confidence
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <span>{getSourceIcon(signal.detectionSource)}</span>
                      <span className="ml-1">
                        {signal.detectionSource === 'wallet' 
                          ? 'Smart wallet activity' 
                          : signal.detectionSource === 'pattern'
                          ? 'Pattern detection'
                          : 'AI prediction'}
                      </span>
                      <span className="mx-1">•</span>
                      <span>{formatTimeAgo(signal.detectedAt)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center ${
                    signal.predictedMovement > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {signal.predictedMovement > 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    <span>{signal.predictedMovement > 0 ? '+' : ''}{signal.predictedMovement}%</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleTradeClick(signal)}
                    className={`text-xs h-7 flex-grow ${
                      signal.signalType === 'buy'
                        ? 'bg-green-600 hover:bg-green-700'
                        : signal.signalType === 'sell'
                        ? 'bg-red-600 hover:bg-red-700'
                        : ''
                    }`}
                  >
                    {signal.signalType === 'watch' ? 'Add to Watchlist' : 'Trade'}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="bg-black/20 border-white/10 h-7 w-7"
                    onClick={() => window.open(`https://birdeye.so/token/${signal.tokenAddress}?chain=solana`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              No smart money signals detected
            </div>
          )}
        </div>
        <div className="mt-4 bg-blue-900/10 border border-blue-500/20 rounded-md p-2">
          <p className="text-xs text-blue-300 flex items-center">
            <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
            Signals are generated by analyzing smart money wallet activity and market patterns
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartMoneySignals;
