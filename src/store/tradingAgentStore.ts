/**
 * Store for managing trading agent state.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Agent, 
  AgentType, 
  AgentLog, 
  tradingAgentService 
} from '../services/tradingAgentService';

interface TradingAgentState {
  // Agents
  agents: Agent[];
  selectedAgentId: string | null;
  isLoadingAgents: boolean;
  agentError: string | null;
  
  // Agent types
  agentTypes: AgentType[];
  isLoadingAgentTypes: boolean;
  agentTypesError: string | null;
  
  // Agent logs
  agentLogs: Record<string, AgentLog[]>;
  isLoadingLogs: boolean;
  logsError: string | null;
  
  // Actions
  fetchAgents: () => Promise<void>;
  fetchAgent: (id: string) => Promise<Agent | null>;
  createAgent: (name: string, type: string, config: Record<string, any>) => Promise<Agent | null>;
  updateAgent: (id: string, name?: string, config?: Record<string, any>) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  startAgent: (id: string) => Promise<Agent | null>;
  stopAgent: (id: string) => Promise<Agent | null>;
  selectAgent: (id: string | null) => void;
  
  fetchAgentTypes: () => Promise<void>;
  fetchAgentType: (type: string) => Promise<AgentType | null>;
  
  fetchAgentLogs: (id: string, limit?: number, level?: string) => Promise<void>;
  
  executeAgentAction: (id: string, actionType: string, parameters?: Record<string, any>) => Promise<any>;
  
  clearErrors: () => void;
}

export const useTradingAgentStore = create<TradingAgentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        agents: [],
        selectedAgentId: null,
        isLoadingAgents: false,
        agentError: null,
        
        agentTypes: [],
        isLoadingAgentTypes: false,
        agentTypesError: null,
        
        agentLogs: {},
        isLoadingLogs: false,
        logsError: null,
        
        // Actions
        fetchAgents: async () => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agents = await tradingAgentService.getAgents();
            set({ agents, isLoadingAgents: false });
          } catch (error) {
            console.error('Error fetching agents:', error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : 'Failed to fetch agents' 
            });
          }
        },
        
        fetchAgent: async (id: string) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agent = await tradingAgentService.getAgent(id);
            
            // Update the agent in the agents array
            const { agents } = get();
            const updatedAgents = agents.map(a => a.id === id ? agent : a);
            
            set({ agents: updatedAgents, isLoadingAgents: false });
            return agent;
          } catch (error) {
            console.error(`Error fetching agent ${id}:`, error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : `Failed to fetch agent ${id}` 
            });
            return null;
          }
        },
        
        createAgent: async (name: string, type: string, config: Record<string, any>) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agent = await tradingAgentService.createAgent({ name, type, config });
            
            // Add the new agent to the agents array
            const { agents } = get();
            set({ agents: [...agents, agent], isLoadingAgents: false });
            
            return agent;
          } catch (error) {
            console.error('Error creating agent:', error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : 'Failed to create agent' 
            });
            return null;
          }
        },
        
        updateAgent: async (id: string, name?: string, config?: Record<string, any>) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agent = await tradingAgentService.updateAgent(id, { name, config });
            
            // Update the agent in the agents array
            const { agents } = get();
            const updatedAgents = agents.map(a => a.id === id ? agent : a);
            
            set({ agents: updatedAgents, isLoadingAgents: false });
            return agent;
          } catch (error) {
            console.error(`Error updating agent ${id}:`, error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : `Failed to update agent ${id}` 
            });
            return null;
          }
        },
        
        deleteAgent: async (id: string) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            await tradingAgentService.deleteAgent(id);
            
            // Remove the agent from the agents array
            const { agents, selectedAgentId } = get();
            const updatedAgents = agents.filter(a => a.id !== id);
            
            // If the deleted agent was selected, clear the selection
            const newSelectedAgentId = selectedAgentId === id ? null : selectedAgentId;
            
            set({ 
              agents: updatedAgents, 
              selectedAgentId: newSelectedAgentId,
              isLoadingAgents: false 
            });
            
            return true;
          } catch (error) {
            console.error(`Error deleting agent ${id}:`, error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : `Failed to delete agent ${id}` 
            });
            return false;
          }
        },
        
        startAgent: async (id: string) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agent = await tradingAgentService.startAgent(id);
            
            // Update the agent in the agents array
            const { agents } = get();
            const updatedAgents = agents.map(a => a.id === id ? agent : a);
            
            set({ agents: updatedAgents, isLoadingAgents: false });
            return agent;
          } catch (error) {
            console.error(`Error starting agent ${id}:`, error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : `Failed to start agent ${id}` 
            });
            return null;
          }
        },
        
        stopAgent: async (id: string) => {
          set({ isLoadingAgents: true, agentError: null });
          try {
            const agent = await tradingAgentService.stopAgent(id);
            
            // Update the agent in the agents array
            const { agents } = get();
            const updatedAgents = agents.map(a => a.id === id ? agent : a);
            
            set({ agents: updatedAgents, isLoadingAgents: false });
            return agent;
          } catch (error) {
            console.error(`Error stopping agent ${id}:`, error);
            set({ 
              isLoadingAgents: false, 
              agentError: error instanceof Error ? error.message : `Failed to stop agent ${id}` 
            });
            return null;
          }
        },
        
        selectAgent: (id: string | null) => {
          set({ selectedAgentId: id });
        },
        
        fetchAgentTypes: async () => {
          set({ isLoadingAgentTypes: true, agentTypesError: null });
          try {
            const agentTypes = await tradingAgentService.getAgentTypes();
            set({ agentTypes, isLoadingAgentTypes: false });
          } catch (error) {
            console.error('Error fetching agent types:', error);
            set({ 
              isLoadingAgentTypes: false, 
              agentTypesError: error instanceof Error ? error.message : 'Failed to fetch agent types' 
            });
          }
        },
        
        fetchAgentType: async (type: string) => {
          set({ isLoadingAgentTypes: true, agentTypesError: null });
          try {
            const agentType = await tradingAgentService.getAgentType(type);
            
            // Update the agent type in the agentTypes array
            const { agentTypes } = get();
            const updatedAgentTypes = agentTypes.map(t => t.type === type ? agentType : t);
            
            set({ agentTypes: updatedAgentTypes, isLoadingAgentTypes: false });
            return agentType;
          } catch (error) {
            console.error(`Error fetching agent type ${type}:`, error);
            set({ 
              isLoadingAgentTypes: false, 
              agentTypesError: error instanceof Error ? error.message : `Failed to fetch agent type ${type}` 
            });
            return null;
          }
        },
        
        fetchAgentLogs: async (id: string, limit = 100, level?: string) => {
          set({ isLoadingLogs: true, logsError: null });
          try {
            const logs = await tradingAgentService.getAgentLogs(id, limit, level);
            
            // Update the logs for this agent
            const { agentLogs } = get();
            
            set({ 
              agentLogs: { ...agentLogs, [id]: logs }, 
              isLoadingLogs: false 
            });
          } catch (error) {
            console.error(`Error fetching logs for agent ${id}:`, error);
            set({ 
              isLoadingLogs: false, 
              logsError: error instanceof Error ? error.message : `Failed to fetch logs for agent ${id}` 
            });
          }
        },
        
        executeAgentAction: async (id: string, actionType: string, parameters = {}) => {
          try {
            const response = await tradingAgentService.executeAgentAction(id, {
              type: actionType,
              parameters
            });
            
            return response;
          } catch (error) {
            console.error(`Error executing action ${actionType} on agent ${id}:`, error);
            throw error;
          }
        },
        
        clearErrors: () => {
          set({ 
            agentError: null, 
            agentTypesError: null, 
            logsError: null 
          });
        }
      }),
      {
        name: 'trading-agent-store',
        partialize: (state) => ({
          agents: state.agents,
          selectedAgentId: state.selectedAgentId,
          agentTypes: state.agentTypes
        })
      }
    )
  )
);
