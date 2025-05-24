import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TradingAgent } from '@/services/tradingAgentsService';

interface AgentCardProps {
  agent: TradingAgent;
  onStart: (agentId: string) => void;
  onStop: (agentId: string) => void;
  onEdit: (agent: TradingAgent) => void;
  onDelete: (agentId: string) => void;
  onViewLogs: (agentId: string) => void;
  isLoading?: boolean;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onViewLogs,
  isLoading = false
}) => {
  const [isActionLoading, setIsActionLoading] = useState(false);

  const getStatusIcon = (status: TradingAgent['status']) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'starting':
      case 'stopping':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TradingAgent['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'stopped':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getAgentIcon = (agentType: string) => {
    // You can customize icons based on agent type
    return <BarChart3 className="h-6 w-6" />;
  };

  const handleStart = async () => {
    setIsActionLoading(true);
    try {
      await onStart(agent.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStop = async () => {
    setIsActionLoading(true);
    try {
      await onStop(agent.id);
    } finally {
      setIsActionLoading(false);
    }
  };

  const isDisabled = isLoading || isActionLoading || agent.status === 'starting' || agent.status === 'stopping';

  return (
    <Card className="bg-trading-darkAccent border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-trading-highlight/20 rounded-lg">
              {getAgentIcon(agent.agent_type)}
            </div>
            <div>
              <CardTitle className="text-white">{agent.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(agent.status)}
                <Badge className={cn("text-xs", getStatusColor(agent.status))}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {agent.status === 'running' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                disabled={isDisabled}
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleStart}
                disabled={isDisabled}
                className="bg-green-500/20 border-green-500/30 text-green-400 hover:bg-green-500/30"
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="bg-trading-darkAccent border-white/10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-trading-darkAccent border-white/10">
                <DropdownMenuItem onClick={() => onEdit(agent)} className="text-white hover:bg-white/10">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewLogs(agent.id)} className="text-white hover:bg-white/10">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Logs
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(agent.id)} 
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-gray-300">
          {agent.agent_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - 
          Automated trading agent for {agent.agent_type === 'copy_trading' ? 'copy trading' : 
                                      agent.agent_type === 'sol_scanner' ? 'token scanning' :
                                      agent.agent_type === 'hyperliquid_trading' ? 'liquidation trading' :
                                      agent.agent_type === 'sniper' ? 'token sniping' : 'trading'}
        </CardDescription>
        
        {agent.metrics && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
            <div>
              <p className="text-xs text-gray-400">Trades</p>
              <p className="text-sm font-medium text-white">{agent.metrics.total_trades || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Win Rate</p>
              <p className="text-sm font-medium text-white">{agent.metrics.win_rate || 0}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">P&L</p>
              <p className={cn(
                "text-sm font-medium",
                (agent.metrics.pnl || 0) >= 0 ? "text-green-400" : "text-red-400"
              )}>
                ${(agent.metrics.pnl || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Uptime</p>
              <p className="text-sm font-medium text-white">{agent.metrics.uptime || 'N/A'}</p>
            </div>
          </div>
        )}
        
        {agent.metrics?.last_activity && (
          <div className="text-xs text-gray-400">
            Last activity: {new Date(agent.metrics.last_activity).toLocaleString()}
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          Created: {new Date(agent.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
