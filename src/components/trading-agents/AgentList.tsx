/**
 * Component for displaying a list of trading agents.
 */
import { Agent } from '../../services/tradingAgentService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  isLoading: boolean;
  onSelectAgent: (id: string | null) => void;
}

const AgentList = ({ agents, selectedAgentId, isLoading, onSelectAgent }: AgentListProps) => {
  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'starting':
      case 'stopping':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  // Function to get agent type display name
  const getAgentTypeDisplay = (type: string) => {
    switch (type) {
      case 'copy_trading':
        return 'Copy Trading';
      case 'liquidation':
        return 'Liquidation';
      case 'scanner':
        return 'Scanner';
      case 'sniper':
        return 'Sniper';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agents ({agents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {agents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agents found. Create your first agent to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedAgentId === agent.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-card hover:bg-primary/5 border border-border'
                  }`}
                  onClick={() => onSelectAgent(agent.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg truncate">{agent.name}</h3>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {getAgentTypeDisplay(agent.type)}
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>ID: {agent.id.substring(0, 8)}...</span>
                    <span>
                      {new Date(agent.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AgentList;
