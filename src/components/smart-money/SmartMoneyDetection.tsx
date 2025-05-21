import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, ExternalLink, AlertCircle, TrendingUp, Wallet } from "lucide-react";
import SmartMoneyCard from "./SmartMoneyCard";
import { SAMPLE_SIGNALS, SmartMoneySignal } from "@/data/mockData";
import { formatTimeAgo, formatAmount } from "@/utils/formatUtils";

const SmartMoneyDetection: React.FC = () => {
  const [signals, setSignals] = useState<SmartMoneySignal[]>(SAMPLE_SIGNALS);
  const [searchTerm, setSearchTerm] = useState("");
  
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return <Badge className="bg-green-600">High</Badge>;
    } else if (confidence >= 70) {
      return <Badge className="bg-blue-600">Medium</Badge>;
    } else {
      return <Badge className="bg-amber-600">Low</Badge>;
    }
  };
  
  // Filter signals based on search term
  const filteredSignals = signals.filter(signal => 
    signal.tokenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.tokenSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.walletLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <SmartMoneyCard
      title="Smart Money Detection"
      icon={TrendingUp}
      iconColor="text-blue-400"
    >
      <div className="flex justify-end mb-4">
        <div className="relative w-1/3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search signals..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredSignals.length > 0 ? (
          filteredSignals.map(signal => (
            <div key={signal.id} className="bg-black/20 p-3 rounded-md border border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={signal.action === "buy" ? "bg-green-600" : "bg-red-600"}>
                      {signal.action === "buy" ? "BUY" : "SELL"}
                    </Badge>
                    <span className="font-medium">${signal.tokenSymbol}</span>
                    <span className="text-sm text-gray-400">{signal.tokenName}</span>
                    {getConfidenceBadge(signal.confidence)}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Wallet className="h-3 w-3 text-blue-400" />
                    <span className="text-blue-400">{signal.walletLabel}</span>
                    <span className="text-gray-400 text-xs">
                      {signal.walletAddress.slice(0, 4)}...{signal.walletAddress.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{formatTimeAgo(signal.timestamp)}</div>
                  <div className="font-medium mt-1">{formatAmount(signal.amount, signal.tokenSymbol)}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <AlertCircle className="h-3 w-3" />
                  <span>Confidence: {signal.confidence}%</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => window.open(`https://solscan.io/token/${signal.tokenAddress}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Token
                  </Button>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      toast.success(`Added ${signal.tokenSymbol} to watchlist`);
                    }}
                  >
                    Track Token
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No smart money signals found
          </div>
        )}
      </div>
    </SmartMoneyCard>
  );
};

export default SmartMoneyDetection;
