/**
 * Component for displaying agent logs.
 */
import { useState } from 'react';
import { AgentLog } from '../../services/tradingAgentService';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { Card } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface AgentLogsProps {
  agentId: string;
  logs: AgentLog[];
  isLoading: boolean;
}

const AgentLogs = ({ agentId, logs, isLoading }: AgentLogsProps) => {
  const [logLevel, setLogLevel] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState(100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { fetchAgentLogs } = useTradingAgentStore();
  
  // Function to refresh logs
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAgentLogs(agentId, limit, logLevel);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to get log level color
  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div>
            <Select
              value={logLevel}
              onValueChange={(value) => {
                setLogLevel(value === 'all' ? undefined : value);
                fetchAgentLogs(agentId, limit, value === 'all' ? undefined : value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                const newLimit = parseInt(value);
                setLimit(newLimit);
                fetchAgentLogs(agentId, newLimit, logLevel);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="100 logs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 logs</SelectItem>
                <SelectItem value="100">100 logs</SelectItem>
                <SelectItem value="200">200 logs</SelectItem>
                <SelectItem value="500">500 logs</SelectItem>
                <SelectItem value="1000">1000 logs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card className="p-4">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found. Start the agent to generate logs.
            </div>
          ) : (
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="flex">
                  <span className="text-muted-foreground mr-2">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`mr-2 font-semibold ${getLogLevelColor(log.level)}`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};

export default AgentLogs;
