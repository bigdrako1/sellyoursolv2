import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Download, 
  Search, 
  Filter,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogEntry, getAgentLogs } from '@/services/tradingAgentsService';

interface AgentLogsViewerProps {
  agentId: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}

const AgentLogsViewer: React.FC<AgentLogsViewerProps> = ({
  agentId,
  agentName,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchLogs = async () => {
    if (!agentId) return;
    
    setIsLoading(true);
    try {
      const fetchedLogs = await getAgentLogs(agentId, {
        limit: 1000,
        level: levelFilter === 'all' ? undefined : levelFilter
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && agentId) {
      fetchLogs();
    }
  }, [isOpen, agentId, levelFilter]);

  useEffect(() => {
    if (autoRefresh && isOpen) {
      refreshIntervalRef.current = setInterval(fetchLogs, 5000);
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, isOpen]);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm]);

  useEffect(() => {
    if (filteredLogs.length > 0) {
      scrollToBottom();
    }
  }, [filteredLogs]);

  const getLevelIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'debug':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${agentName}_logs_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-trading-darkAccent border-white/10 w-full max-w-6xl h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Agent Logs - {agentName}
                {autoRefresh && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Live
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Real-time logs and activity from the trading agent
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-trading-darkAccent border-white/10 text-white"
              />
            </div>

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32 bg-trading-darkAccent border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-trading-darkAccent border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Levels</SelectItem>
                <SelectItem value="error" className="text-white hover:bg-white/10">Error</SelectItem>
                <SelectItem value="warning" className="text-white hover:bg-white/10">Warning</SelectItem>
                <SelectItem value="info" className="text-white hover:bg-white/10">Info</SelectItem>
                <SelectItem value="debug" className="text-white hover:bg-white/10">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "bg-trading-darkAccent border-white/10",
                autoRefresh ? "text-green-400 border-green-500/30" : "text-white"
              )}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", autoRefresh && "animate-spin")} />
              Auto Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-y-auto p-6 font-mono text-sm">
            {isLoading && filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                No logs found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                      {getLevelIcon(log.level)}
                      <Badge className={cn("text-xs", getLevelColor(log.level))}>
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400 min-w-0 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-white min-w-0 flex-1 break-words">
                      {log.message}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentLogsViewer;
