
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, Terminal, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'error' | 'warn' | 'info' | 'log';
  details?: any;
}

interface DebugPanelProps {
  maxLogs?: number;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ maxLogs = 100 }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hasErrors, setHasErrors] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Override console methods to capture logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    // Function to add log entry
    const addLogEntry = (message: string, type: LogEntry['type'], details?: any) => {
      setLogs(prevLogs => {
        const newLogs = [
          ...prevLogs, 
          { timestamp: new Date(), message, type, details }
        ].slice(-maxLogs);
        return newLogs;
      });
      
      if (type === 'error') {
        setHasErrors(true);
      }
    };

    // Override console methods
    console.log = function(...args) {
      originalConsole.log(...args);
      addLogEntry(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'log');
    };
    
    console.error = function(...args) {
      originalConsole.error(...args);
      addLogEntry(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'error', args[0]);
    };
    
    console.warn = function(...args) {
      originalConsole.warn(...args);
      addLogEntry(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'warn');
    };
    
    console.info = function(...args) {
      originalConsole.info(...args);
      addLogEntry(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '), 'info');
    };

    // Restore original console on cleanup
    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    };
  }, [maxLogs]);

  // Scroll to bottom when logs change
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
    setHasErrors(false);
  };

  // Determine badge variant - use standard variants only
  const getBadgeVariant = (): "default" | "destructive" | "outline" | "secondary" => {
    if (hasErrors) return "destructive";
    if (logs.length > 0) return "default";
    return "outline";
  };

  // Format the log message
  const formatLogMessage = (log: LogEntry) => {
    const time = log.timestamp.toLocaleTimeString();
    return `[${time}] ${log.message}`;
  };

  // Get log entry class based on type
  const getLogClass = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-300';
    }
  };

  return (
    <Card className={`card-with-border ${hasErrors ? 'border-red-500/30' : ''}`}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>Debug Console</span>
            {logs.length > 0 && (
              <Badge variant={getBadgeVariant()}>
                {logs.length} {hasErrors && <AlertTriangle className="h-3 w-3 ml-1" />}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  clearLogs();
                }}
                title="Clear logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <span className="text-xs">{expanded ? '▼' : '▶'}</span>
          </div>
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No logs to display</div>
          ) : (
            <div className="h-[300px] overflow-y-auto bg-trading-darkerAccent p-3 rounded-b-md">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-xs py-1 font-mono ${getLogClass(log.type)} break-all`}
                >
                  {formatLogMessage(log)}
                  {log.type === 'error' && log.details && (
                    <div className="pl-6 mt-1 text-xs text-red-400">
                      {typeof log.details === 'object' && log.details.stack ? log.details.stack.split('\n').map((line: string, i: number) => (
                        <div key={i} className="text-red-400/70">{line}</div>
                      )) : null}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DebugPanel;
