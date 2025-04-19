
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Cpu, Server, Globe, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface SystemStatusProps {
  latency: number | null;
  systemActive: boolean;
}

const SystemStatus = ({ latency, systemActive }: SystemStatusProps) => {
  const [cpuLoad, setCpuLoad] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("optimal");
  
  // Simulate changing system metrics
  useEffect(() => {
    if (!systemActive) {
      setCpuLoad(0);
      setMemoryUsage(0);
      return;
    }
    
    const interval = setInterval(() => {
      // Simulate CPU load between 30-70%
      setCpuLoad(Math.floor(Math.random() * 40) + 30);
      
      // Simulate memory usage between 40-75%
      setMemoryUsage(Math.floor(Math.random() * 35) + 40);
      
      // Update uptime
      setUptime(prev => prev + 1);
      
      // Connection status changes occasionally
      if (Math.random() > 0.95) {
        setConnectionStatus(Math.random() > 0.5 ? "degraded" : "optimal");
      } else if (connectionStatus === "degraded" && Math.random() > 0.7) {
        setConnectionStatus("optimal");
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [systemActive, connectionStatus]);
  
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  };
  
  return (
    <Card className="trading-card">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">System Status</h3>
          <Badge 
            variant="outline" 
            className={
              !systemActive ? "bg-trading-danger/20 text-trading-danger border-none" :
              connectionStatus === "optimal" ? "bg-trading-success/20 text-trading-success border-none" :
              "bg-trading-warning/20 text-trading-warning border-none"
            }
          >
            {!systemActive ? "Offline" : 
             connectionStatus === "optimal" ? "All Systems Operational" : "Performance Degraded"}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-trading-highlight" />
              <div>
                <div className="text-sm text-gray-400">AI System Load</div>
                <div className="flex items-center">
                  <span className="font-medium">{cpuLoad}%</span>
                  <Progress value={cpuLoad} className="h-1.5 w-20 ml-2" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server size={18} className="text-trading-highlight" />
              <div>
                <div className="text-sm text-gray-400">Memory Usage</div>
                <div className="flex items-center">
                  <span className="font-medium">{memoryUsage}%</span>
                  <Progress value={memoryUsage} className="h-1.5 w-20 ml-2" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-trading-secondary" />
              <div>
                <div className="text-sm text-gray-400">Network Latency</div>
                <div className="font-medium">{latency ? `${latency}ms` : "N/A"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-trading-secondary" />
              <div>
                <div className="text-sm text-gray-400">System Uptime</div>
                <div className="font-medium">{systemActive ? formatUptime(uptime) : "N/A"}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-3 border border-white/5">
            <div className="flex items-start gap-2">
              {systemActive ? (
                <>
                  <ShieldCheck size={16} className="text-trading-success mt-0.5" />
                  <div>
                    <div className="font-medium">System Protected</div>
                    <p className="text-xs text-gray-400">
                      All trading operations are secured with real-time monitoring and automated risk management protocols.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-trading-danger mt-0.5" />
                  <div>
                    <div className="font-medium">System Inactive</div>
                    <p className="text-xs text-gray-400">
                      Autonomous trading is currently disabled. Activate the system to begin trading operations.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SystemStatus;
