
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ArrowUpRight, ArrowDownRight, BarChart2, Wallet, Brain } from "lucide-react";
import { useState, useEffect } from "react";

interface Alert {
  id: number;
  type: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  timestamp: Date;
  icon: "trade" | "wallet" | "system" | "market" | "ai";
  action?: string;
}

const TradeAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Simulate initial alerts
  useEffect(() => {
    const initialAlerts: Alert[] = [
      {
        id: 1,
        type: "success",
        title: "SOL Trade Completed",
        message: "Front Runner AI executed SOL trade with +4.8% profit",
        timestamp: new Date(Date.now() - 120000), // 2 mins ago
        icon: "trade",
        action: "View Trade"
      },
      {
        id: 2,
        type: "info",
        title: "Market Movement Detected",
        message: "Unusual volume detected in FBOT token on BSC",
        timestamp: new Date(Date.now() - (5 * 60000)), // 5 mins ago
        icon: "market"
      },
      {
        id: 3,
        type: "warning",
        title: "Wallet Activity",
        message: "Whale wallet 8xHf6...3Zdy7 moved $45K in BNB",
        timestamp: new Date(Date.now() - (18 * 60000)), // 18 mins ago
        icon: "wallet"
      },
      {
        id: 4,
        type: "info",
        title: "AI Strategy Update",
        message: "Market Runner detection threshold auto-adjusted to 65%",
        timestamp: new Date(Date.now() - (34 * 60000)), // 34 mins ago
        icon: "ai"
      }
    ];
    
    setAlerts(initialAlerts);
    
    // Simulate new alerts coming in
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const alertTypes = ["info", "success", "warning", "danger"];
        const alertIcons = ["trade", "wallet", "system", "market", "ai"];
        
        const newAlert: Alert = {
          id: Date.now(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)] as "info" | "success" | "warning" | "danger",
          title: generateRandomTitle(),
          message: generateRandomMessage(),
          timestamp: new Date(),
          icon: alertIcons[Math.floor(Math.random() * alertIcons.length)] as "trade" | "wallet" | "system" | "market" | "ai",
        };
        
        if (Math.random() > 0.6) {
          newAlert.action = Math.random() > 0.5 ? "View Trade" : "Analyze";
        }
        
        setAlerts(prev => [newAlert, ...prev].slice(0, 15)); // Keep max 15 alerts
      }
    }, 30000); // Try to add new alerts every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const generateRandomTitle = () => {
    const titles = [
      "New Trading Opportunity",
      "SRUN Price Alert",
      "Market Activity Detected",
      "Whale Movement",
      "Trading Strategy Adjusted",
      "System Performance Update",
      "AI Model Recalibrated",
      "BNB Signal Generated",
      "New Runner Identified",
      "SOL Front Running Alert"
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  };
  
  const generateRandomMessage = () => {
    const messages = [
      "Front Runner AI detected pending transactions for SOL trade",
      "Significant volume increase in SRUN token detected",
      "Wallet tracker identified profitable trade pattern",
      "Market movement indicates potential runner formation",
      "AI adjusted trading parameters based on market conditions",
      "Network congestion detected, gas parameters adjusted",
      "Whale wallet 8xHf6...3Zdy7 executed large buy order",
      "Price breakout detected on 15min timeframe",
      "Risk management protocol adjusted position size",
      "System optimized execution path for lower latency"
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  const getAlertIcon = (iconType: string) => {
    switch (iconType) {
      case "trade":
        return <ArrowUpRight className="h-4 w-4 text-trading-success" />;
      case "wallet":
        return <Wallet className="h-4 w-4 text-trading-highlight" />;
      case "system":
        return <Bell className="h-4 w-4 text-trading-warning" />;
      case "market":
        return <BarChart2 className="h-4 w-4 text-trading-secondary" />;
      case "ai":
        return <Brain className="h-4 w-4 text-purple-400" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-trading-success" />;
    }
  };
  
  const formatAlertTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return timestamp.toLocaleDateString();
  };
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Live Alerts</h3>
          <Badge variant="outline" className="bg-trading-highlight/10 text-trading-highlight border-none">
            {alerts.length} Alerts
          </Badge>
        </div>
        
        <ScrollArea className="h-[220px] pr-4">
          <div className="space-y-3">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className={`
                  p-3 rounded-lg border flex items-start gap-3
                  ${alert.type === "success" ? "bg-trading-success/10 border-trading-success/20" :
                    alert.type === "warning" ? "bg-trading-warning/10 border-trading-warning/20" :
                    alert.type === "danger" ? "bg-trading-danger/10 border-trading-danger/20" :
                    "bg-trading-highlight/10 border-trading-highlight/20"}
                `}
              >
                <div className="mt-0.5">
                  {getAlertIcon(alert.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{alert.title}</span>
                    <span className="text-xs text-gray-400">{formatAlertTime(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                  {alert.action && (
                    <button className="text-xs text-trading-highlight hover:underline mt-1">
                      {alert.action}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default TradeAlerts;
