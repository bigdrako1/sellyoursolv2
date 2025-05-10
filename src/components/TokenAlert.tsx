
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, TrendingUp, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface TokenAlertProps {
  onAlertToggle?: (enabled: boolean) => void;
  initiallyEnabled?: boolean;
}

export const TokenAlert: React.FC<TokenAlertProps> = ({
  onAlertToggle,
  initiallyEnabled = false
}) => {
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(initiallyEnabled);
  const [qualityThreshold, setQualityThreshold] = useState<number>(70);
  const [lastAlertTime, setLastAlertTime] = useState<string | null>(null);
  const [detectedTokensCount, setDetectedTokensCount] = useState<number>(0);
  const [filteredTokensCount, setFilteredTokensCount] = useState<number>(0);

  // Simulated recent alerts - in a real app, this would come from an API or store
  const recentAlerts = [
    {
      token: "BONK",
      quality: 88,
      time: "10:32 AM",
      price: "$0.00002134",
      change: "+12.5%",
      liquidity: "$4.5M",
      isPositive: true
    },
    {
      token: "WIF",
      quality: 78,
      time: "09:15 AM",
      price: "$0.00001421",
      change: "+8.2%",
      liquidity: "$2.8M",
      isPositive: true
    },
    {
      token: "MEME",
      quality: 65,
      time: "08:45 AM",
      price: "$0.00000876",
      change: "-3.4%",
      liquidity: "$1.2M",
      isPositive: false
    }
  ];

  // Toggle alert monitoring
  const toggleAlerts = () => {
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    if (onAlertToggle) {
      onAlertToggle(newState);
    }
    
    toast(newState ? "Token alerts enabled" : "Token alerts disabled", {
      description: newState 
        ? "You will now receive notifications for high-quality tokens." 
        : "You will no longer receive token notifications.",
    });
  };

  // Simulate token detection
  useEffect(() => {
    if (!alertsEnabled) return;
    
    const interval = setInterval(() => {
      // Simulate token detection with random quality scores
      const randomQuality = Math.floor(Math.random() * 100);
      setDetectedTokensCount(prev => prev + 1);
      
      if (randomQuality >= qualityThreshold) {
        setFilteredTokensCount(prev => prev + 1);
        setLastAlertTime(new Date().toLocaleTimeString());
        
        // Simulate a high-quality token alert
        if (Math.random() > 0.7) {
          const tokenName = `SOL${Math.floor(Math.random() * 1000)}`;
          toast("New High-Quality Token Detected", {
            description: `${tokenName} has passed quality filters with score ${randomQuality}.`,
            duration: 5000,
          });
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [alertsEnabled, qualityThreshold]);

  // Calculate quality badge variant based on score
  const getQualityBadge = (score: number) => {
    if (score >= 80) return { variant: "success" as const, text: "High" };
    if (score >= 60) return { variant: "default" as const, text: "Good" };
    return { variant: "destructive" as const, text: "Low" };
  };

  return (
    <Card className="card-with-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Token Alert Monitor</span>
          <Badge 
            variant={alertsEnabled ? "success" : "outline"} 
            className="ml-2"
          >
            {alertsEnabled ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="stats flex gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">Detected</p>
                <p className="text-xl font-semibold">{detectedTokensCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Filtered</p>
                <p className="text-xl font-semibold">{filteredTokensCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Last Alert</p>
                <p className="text-sm font-medium">{lastAlertTime || "None"}</p>
              </div>
            </div>
            <Button 
              onClick={toggleAlerts}
              variant={alertsEnabled ? "outline" : "default"}
              className={alertsEnabled ? "border-trading-success text-trading-success hover:bg-green-500/10" : ""}
            >
              {alertsEnabled ? "Disable Alerts" : "Enable Alerts"}
            </Button>
          </div>

          {/* Recent Alerts */}
          <div>
            <h3 className="font-medium mb-2">Recent Alerts</h3>
            <div className="space-y-2">
              {recentAlerts.map((alert, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-trading-darkAccent rounded-md hover:bg-trading-highlight/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${alert.isPositive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{alert.token}</span>
                    <Badge variant={getQualityBadge(alert.quality).variant}>
                      {getQualityBadge(alert.quality).text} ({alert.quality})
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs gap-3">
                    <span>{alert.price}</span>
                    <span className={alert.isPositive ? 'text-green-500' : 'text-red-500'}>
                      {alert.change}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Filter Explanation */}
          <div className="text-xs text-gray-400 mt-4">
            <p className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> 
              Only tokens with quality score ≥ {qualityThreshold} will trigger alerts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenAlert;
