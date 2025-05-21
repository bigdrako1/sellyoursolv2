import React from "react";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingUp, Wallet } from "lucide-react";
import SmartMoneyCard from "./SmartMoneyCard";
import { mockAlerts } from "@/data/mockData";

const SmartMoneyAlerts: React.FC = () => {
  return (
    <SmartMoneyCard 
      title="Smart Money Alerts" 
      icon={Bell} 
      iconColor="text-yellow-500"
    >
      <div className="space-y-4">
        {mockAlerts.map((alert) => (
          <div 
            key={alert.id} 
            className="flex items-start justify-between p-3 rounded-lg bg-black/20 border border-white/5"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                alert.type === "whale" 
                  ? "bg-blue-900/20 text-blue-400" 
                  : "bg-purple-900/20 text-purple-400"
              }`}>
                {alert.type === "whale" ? (
                  <Wallet className="h-4 w-4" />
                ) : (
                  <TrendingUp className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {alert.address}
                  </span>
                  <Badge variant="outline" className={
                    alert.action === "bought" 
                      ? "bg-green-900/20 text-green-400 text-xs" 
                      : "bg-red-900/20 text-red-400 text-xs"
                  }>
                    {alert.action.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {alert.amount} {alert.token} ({alert.value})
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {alert.time}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="text-center mt-2">
          <a href="#" className="text-xs text-blue-400 hover:underline">
            View all alerts
          </a>
        </div>
      </div>
    </SmartMoneyCard>
  );
};

export default SmartMoneyAlerts;
