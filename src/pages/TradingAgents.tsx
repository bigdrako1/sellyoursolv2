/**
 * Trading Agents page.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingAgentStore } from '../store/tradingAgentStore';
import Layout from '../components/Layout';
import Breadcrumbs from '../components/Breadcrumbs';
import AgentList from '../components/trading-agents/AgentList';
import AgentDetails from '../components/trading-agents/AgentDetails';
import CreateAgentModal from '../components/trading-agents/CreateAgentModal';
import { Button } from '../components/ui/button';
import { PlusIcon } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const TradingAgents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { 
    agents, 
    selectedAgentId, 
    isLoadingAgents, 
    agentError,
    fetchAgents, 
    selectAgent,
    clearErrors
  } = useTradingAgentStore();
  
  // Fetch agents on mount
  useEffect(() => {
    fetchAgents();
    
    // Clean up on unmount
    return () => {
      clearErrors();
    };
  }, [fetchAgents, clearErrors]);
  
  // Show error toast if there's an error
  useEffect(() => {
    if (agentError) {
      toast({
        title: 'Error',
        description: agentError,
        variant: 'destructive'
      });
    }
  }, [agentError, toast]);
  
  // Get the selected agent
  const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Trading Agents', href: '/trading-agents' }
          ]}
        />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Trading Agents</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="md:col-span-1">
            <AgentList 
              agents={agents}
              selectedAgentId={selectedAgentId}
              isLoading={isLoadingAgents}
              onSelectAgent={selectAgent}
            />
          </div>
          
          {/* Agent Details */}
          <div className="md:col-span-2">
            {selectedAgent ? (
              <AgentDetails agent={selectedAgent} />
            ) : (
              <div className="bg-card rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-semibold mb-4">No Agent Selected</h2>
                <p className="text-muted-foreground mb-6">
                  Select an agent from the list to view its details, or create a new agent to get started.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Create Agent Modal */}
        <CreateAgentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </Layout>
  );
};

export default TradingAgents;
