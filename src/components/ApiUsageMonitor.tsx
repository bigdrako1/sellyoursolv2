
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getApiUsageStats } from "@/utils/apiUtils";
import { AlertCircle, Check, BarChart } from "lucide-react";

const ApiUsageMonitor = () => {
  const [usageStats, setUsageStats] = useState({
    totalCalls: 0,
    dailyCalls: {} as Record<string, number>,
    methodCalls: {} as Record<string, number>,
    rateExceeded: 0,
    lastReset: 0,
  });
  
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  const todayCalls = usageStats.dailyCalls[today] || 0;
  
  // Calculate daily usage percentage (assuming a daily limit of 1000)
  const dailyLimit = 1000;
  const dailyUsagePercent = Math.min(100, (todayCalls / dailyLimit) * 100);

  useEffect(() => {
    // Update usage stats every minute
    const fetchStats = () => {
      const stats = getApiUsageStats();
      setUsageStats(stats);
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Get top methods by usage
  const topMethods = Object.entries(usageStats.methodCalls)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          <span>Helius API Usage</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily API Calls</span>
            <span className="font-medium">{todayCalls} / {dailyLimit}</span>
          </div>
          <Progress value={dailyUsagePercent} 
            className={`${dailyUsagePercent > 80 ? 'bg-red-200' : 'bg-blue-200'}`} />
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <span className="text-sm text-muted-foreground">Total Calls</span>
              <p className="font-medium">{usageStats.totalCalls}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Rate Limit Errors</span>
              <p className="font-medium text-red-500">{usageStats.rateExceeded}</p>
            </div>
          </div>
          
          {topMethods.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Top Endpoints</h4>
              <ul className="space-y-1">
                {topMethods.map(([method, count]) => (
                  <li key={method} className="text-xs flex justify-between">
                    <span className="text-muted-foreground">{method}</span>
                    <span>{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiUsageMonitor;
