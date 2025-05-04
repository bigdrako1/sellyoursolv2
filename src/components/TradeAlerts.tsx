
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, ArrowUpRight, ArrowDownRight, BarChart2, Wallet, Brain } from "lucide-react";
import { useState } from "react";

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
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No alerts yet</p>
              <p className="text-xs mt-1">Alerts will appear here when detected</p>
            </div>
          ) : (
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
          )}
        </ScrollArea>
      </div>
    </Card>
  );
};

export default TradeAlerts;
