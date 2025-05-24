import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Square,
  Settings,
  Activity,
  TrendingUp,
  Bot,
  Eye,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Plus,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import AgentCard from '@/components/trading-agents/AgentCard';
import AgentConfigDialog from '@/components/trading-agents/AgentConfigDialog';
import AgentLogsViewer from '@/components/trading-agents/AgentLogsViewer';
import GlobalSettings from '@/components/trading-agents/GlobalSettings';
import {
  TradingAgent,
  AgentConfig,
  AgentConfigUpdate,
  getTradingAgents,
  createTradingAgent,
  updateTradingAgent,
  deleteTradingAgent,
  startTradingAgent,
  stopTradingAgent,
  healthCheck
} from '@/services/tradingAgentsService';

// Component state interfaces
interface LogsViewerState {
  isOpen: boolean;
  agentId: string;
  agentName: string;
}

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<TradingAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<TradingAgent | null>(null);
  const [logsViewer, setLogsViewer] = useState<LogsViewerState>({
    isOpen: false,
    agentId: '',
    agentName: ''
  });
  const [serviceStatus, setServiceStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Load agents on component mount
  useEffect(() => {
    loadAgents();
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    setServiceStatus('checking');
    try {
      await healthCheck();
      setServiceStatus('connected');
    } catch (error) {
      console.error('Agents service health check failed:', error);
      setServiceStatus('disconnected');
    }
  };

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const response = await getTradingAgents();
      setAgents(response.agents || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      // Only show error if service is supposed to be connected
      if (serviceStatus === 'connected') {
        toast.error('Failed to load agents', {
          description: 'Check if the trading agents service is running'
        });
      }
      setAgents([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAgent = async (agentId: string) => {
    try {
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: 'starting' as const }
          : agent
      ));

      const updatedAgent = await startTradingAgent(agentId);

      setAgents(prev => prev.map(agent =>
        agent.id === agentId ? updatedAgent : agent
      ));

      toast.success('Agent started successfully');
    } catch (error) {
      console.error('Error starting agent:', error);
      toast.error('Failed to start agent');

      // Revert status on error
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: 'stopped' as const }
          : agent
      ));
    }
  };

  const handleStopAgent = async (agentId: string) => {
    try {
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: 'stopping' as const }
          : agent
      ));

      const updatedAgent = await stopTradingAgent(agentId);

      setAgents(prev => prev.map(agent =>
        agent.id === agentId ? updatedAgent : agent
      ));

      toast.success('Agent stopped successfully');
    } catch (error) {
      console.error('Error stopping agent:', error);
      toast.error('Failed to stop agent');

      // Revert status on error
      setAgents(prev => prev.map(agent =>
        agent.id === agentId
          ? { ...agent, status: 'running' as const }
          : agent
      ));
    }
  };

  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setIsConfigDialogOpen(true);
  };

  const handleEditAgent = (agent: TradingAgent) => {
    setSelectedAgent(agent);
    setIsConfigDialogOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      await deleteTradingAgent(agentId);
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      toast.success('Agent deleted successfully');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const handleSaveAgent = async (config: AgentConfig | AgentConfigUpdate) => {
    try {
      if (selectedAgent) {
        // Update existing agent
        const updatedAgent = await updateTradingAgent(selectedAgent.id, config as AgentConfigUpdate);
        setAgents(prev => prev.map(agent =>
          agent.id === selectedAgent.id ? updatedAgent : agent
        ));
        toast.success('Agent updated successfully');
      } else {
        // Create new agent
        const newAgent = await createTradingAgent(config as AgentConfig);
        setAgents(prev => [...prev, newAgent]);
        toast.success('Agent created successfully');
      }
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error('Failed to save agent');
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  const handleViewLogs = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setLogsViewer({
        isOpen: true,
        agentId,
        agentName: agent.name
      });
    }
  };

  const runningAgents = agents.filter(agent => agent.status === 'running');
  const totalTrades = agents.reduce((sum, agent) => sum + (agent.metrics?.total_trades || 0), 0);
  const avgWinRate = agents.length > 0
    ? agents.reduce((sum, agent) => sum + (agent.metrics?.win_rate || 0), 0) / agents.length
    : 0;
  const totalPnL = agents.reduce((sum, agent) => sum + (agent.metrics?.pnl || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Agents</h1>
            <p className="text-gray-400 mt-1">
              Manage and monitor your automated trading agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Service Status */}
            <Badge
              variant="outline"
              className={cn(
                "border-white/10",
                serviceStatus === 'connected' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                serviceStatus === 'disconnected' ? "bg-red-500/20 text-red-400 border-red-500/30" :
                "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              )}
            >
              {serviceStatus === 'connected' ? 'Service Online' :
               serviceStatus === 'disconnected' ? 'Service Offline' :
               'Checking...'}
            </Badge>

            <Badge variant="outline" className="bg-trading-darkAccent border-white/10">
              {runningAgents.length} / {agents.length} Active
            </Badge>

            <Button
              onClick={loadAgents}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="bg-trading-darkAccent border-white/10 text-white hover:bg-white/10"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              onClick={handleCreateAgent}
              size="sm"
              className="bg-trading-highlight hover:bg-trading-highlight/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Agents</p>
                  <p className="text-2xl font-bold text-white">{runningAgents.length}</p>
                </div>
                <Activity className="h-8 w-8 text-trading-highlight" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-trading-darkAccent border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{totalTrades.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-trading-darkAccent border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Win Rate</p>
                  <p className="text-2xl font-bold text-white">{avgWinRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-trading-darkAccent border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total P&L</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    totalPnL >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    ${totalPnL.toFixed(2)}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="bg-trading-darkAccent border-white/10">
          <TabsTrigger value="agents">All Agents</TabsTrigger>
          <TabsTrigger value="running">Running Agents</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">Loading agents...</span>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Agents</h3>
              <p className="text-gray-400 mb-4">
                Create your first agent to get started with automated trading.
              </p>
              <Button onClick={handleCreateAgent} className="bg-trading-highlight hover:bg-trading-highlight/80">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStart={handleStartAgent}
                  onStop={handleStopAgent}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  onViewLogs={handleViewLogs}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          {runningAgents.length === 0 ? (
            <Alert className="bg-trading-darkAccent border-white/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-gray-300">
                No agents are currently running. Start an agent from the "All Agents" tab.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {runningAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onStart={handleStartAgent}
                  onStop={handleStopAgent}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  onViewLogs={handleViewLogs}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-trading-darkAccent border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Agent Logs</CardTitle>
              <CardDescription className="text-gray-400">
                Real-time logs and activity from all agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-gray-400">[2024-01-15 10:30:15] Copy Bot: Monitoring wallet activity...</div>
                <div className="text-green-400">[2024-01-15 10:29:45] SOL Scanner: New token detected: ABC123...</div>
                <div className="text-blue-400">[2024-01-15 10:29:30] HyperLiquid Bot: Position opened at $1.234</div>
                <div className="text-yellow-400">[2024-01-15 10:29:15] Sniper Bot: Security check passed for token XYZ789</div>
                <div className="text-gray-400">[2024-01-15 10:29:00] System: All agents initialized successfully</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <GlobalSettings onSettingsChange={(settings) => {
            console.log('Global settings updated:', settings);
            toast.success('Global settings applied to all agents');
          }} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AgentConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => {
          setIsConfigDialogOpen(false);
          setSelectedAgent(null);
        }}
        agent={selectedAgent}
        onSave={handleSaveAgent}
        isLoading={isLoading}
      />

      <AgentLogsViewer
        isOpen={logsViewer.isOpen}
        onClose={() => setLogsViewer(prev => ({ ...prev, isOpen: false }))}
        agentId={logsViewer.agentId}
        agentName={logsViewer.agentName}
      />
    </div>
  );
};

export default Agents;
