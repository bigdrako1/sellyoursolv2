/**
 * Component for displaying trading agent details.
 */
import { useState, useEffect } from 'react';
import { Agent } from '../../services/tradingAgentService';
import { useTradingAgentStore } from '../../store/tradingAgentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, Play, Square, RefreshCw, Trash2, Settings } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import AgentLogs from './AgentLogs';
import AgentMetrics from './AgentMetrics';
import AgentConfig from './AgentConfig';
import AgentActions from './AgentActions';
import DeleteAgentDialog from './DeleteAgentDialog';
import UpdateAgentDialog from './UpdateAgentDialog';

interface AgentDetailsProps {
  agent: Agent;
}

const AgentDetails = ({ agent }: AgentDetailsProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    startAgent, 
    stopAgent, 
    fetchAgent,
    fetchAgentLogs,
    agentLogs,
    isLoadingLogs
  } = useTradingAgentStore();
  
  // Fetch logs when the component mounts or when the agent changes
  useEffect(() => {
    if (agent) {
      fetchAgentLogs(agent.id);
    }
  }, [agent, fetchAgentLogs]);
  
  // Function to refresh agent data
  const handleRefresh = async () => {
    if (!agent) return;
    
    setIsRefreshing(true);
    try {
      await fetchAgent(agent.id);
      await fetchAgentLogs(agent.id);
      toast({
        title: 'Agent refreshed',
        description: 'The agent data has been refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh agent data.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Function to start the agent
  const handleStart = async () => {
    if (!agent) return;
    
    try {
      await startAgent(agent.id);
      toast({
        title: 'Agent started',
        description: 'The agent has been started successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start the agent.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to stop the agent
  const handleStop = async () => {
    if (!agent) return;
    
    try {
      await stopAgent(agent.id);
      toast({
        title: 'Agent stopped',
        description: 'The agent has been stopped successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop the agent.',
        variant: 'destructive',
      });
    }
  };
  
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
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {agent.name}
              <Badge className={`ml-2 ${getStatusColor(agent.status)}`}>
                {agent.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {getAgentTypeDisplay(agent.type)} Agent
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUpdateDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          {agent.status === 'running' || agent.status === 'starting' ? (
            <Button
              variant="outline"
              onClick={handleStop}
              disabled={agent.status === 'stopping'}
            >
              <Square className="mr-2 h-4 w-4" />
              Stop Agent
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleStart}
              disabled={agent.status === 'starting'}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Agent
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Agent ID</h3>
                <p className="text-sm">{agent.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                <p className="text-sm">{getAgentTypeDisplay(agent.type)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
                <p className="text-sm">{new Date(agent.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <p className="text-sm">{new Date(agent.updatedAt).toLocaleString()}</p>
              </div>
            </div>
            
            {agent.status === 'error' && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Agent Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      The agent encountered an error. Check the logs for more details.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <AgentMetrics agent={agent} />
          </TabsContent>
          
          <TabsContent value="metrics">
            <AgentMetrics agent={agent} />
          </TabsContent>
          
          <TabsContent value="logs">
            <AgentLogs 
              agentId={agent.id} 
              logs={agentLogs[agent.id] || []} 
              isLoading={isLoadingLogs} 
            />
          </TabsContent>
          
          <TabsContent value="config">
            <AgentConfig agent={agent} />
          </TabsContent>
          
          <TabsContent value="actions">
            <AgentActions agent={agent} />
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <DeleteAgentDialog
        agent={agent}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
      
      <UpdateAgentDialog
        agent={agent}
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
      />
    </Card>
  );
};

export default AgentDetails;
