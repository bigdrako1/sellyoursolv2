
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ExternalLink, TrendingUp } from "lucide-react";

// Sample trade alerts
const SAMPLE_ALERTS = [
  {
    id: "1",
    tokenName: "Alpha Runner",
    tokenSymbol: "ALPHA",
    tokenAddress: "5qTnnb9UCVzpEErQNgcwi5seVjKc8kizNnWcmgxQt3Us",
    type: "price_gain",
    detail: "increased by 25% in the last hour",
    timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
  },
  {
    id: "2",
    tokenName: "Gamma Coin",
    tokenSymbol: "GAMMA",
    tokenAddress: "5G811VMkkTKU4HTFQZURp5jcfZbD4LF2SGym5qQbviFN",
    type: "quality_token",
    detail: "trending on Jupiter with high quality score",
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  }
];

const TradeAlerts: React.FC = () => {
  const [alerts] = useState(SAMPLE_ALERTS);
  
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
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
  
  const getAlertBadge = (type: string) => {
    switch (type) {
      case "price_gain":
        return <Badge className="bg-green-600">Price Up</Badge>;
      case "price_drop":
        return <Badge className="bg-red-600">Price Down</Badge>;
      case "quality_token":
        return <Badge className="bg-blue-600">Quality Token</Badge>;
      case "whale_activity":
        return <Badge className="bg-purple-600">Whale Activity</Badge>;
      default:
        return <Badge>Alert</Badge>;
    }
  };
  
  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            Trade Alerts
          </div>
          {alerts.length > 0 && <Badge className="bg-amber-600">{alerts.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <div key={alert.id} className="bg-black/20 p-2 rounded-md">
                <div className="flex items-start justify-between">
                  <div>
                    {getAlertBadge(alert.type)}
                    <span className="ml-2 font-medium">${alert.tokenSymbol}</span>
                  </div>
                  <span className="text-xs text-gray-400">{formatTimeAgo(alert.timestamp)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  {alert.tokenName} {alert.detail}
                </div>
                <div className="mt-2 flex gap-1">
                  <Button 
                    size="sm" 
                    className="text-xs h-7 flex-grow"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trade
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="bg-black/20 border-white/10 h-7 w-7"
                    onClick={() => window.open(`https://birdeye.so/token/${alert.tokenAddress}?chain=solana`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-gray-400">
              No alerts at this time
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeAlerts;
