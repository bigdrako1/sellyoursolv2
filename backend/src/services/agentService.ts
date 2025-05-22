/**
 * Service for managing trading agents.
 */
import { AgentServiceClient, AgentConfig, AgentConfigUpdate, AgentAction } from '../clients/agentServiceClient';
import { config } from '../config';

// Create agent service client
const agentServiceClient = new AgentServiceClient(config.agentServiceUrl);

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, any>;
  metrics?: Record<string, any>;
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentCreateParams {
  name: string;
  type: string;
  config: Record<string, any>;
}

export interface AgentUpdateParams {
  name?: string;
  config?: Record<string, any>;
}

export class AgentService {
  /**
   * Get all agents.
   * 
   * @returns List of agents
   */
  static async getAllAgents(): Promise<Agent[]> {
    try {
      const response = await agentServiceClient.getAgents();
      
      // Map API response to our model
      return response.agents.map(agent => ({
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        logs: agent.logs?.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message
        })),
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      }));
    } catch (error) {
      console.error('Error getting agents:', error);
      throw error;
    }
  }
  
  /**
   * Get agent by ID.
   * 
   * @param id Agent ID
   * @returns Agent details
   */
  static async getAgent(id: string): Promise<Agent> {
    try {
      const agent = await agentServiceClient.getAgent(id);
      
      // Map API response to our model
      return {
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        logs: agent.logs?.map(log => ({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message
        })),
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    } catch (error) {
      console.error(`Error getting agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new agent.
   * 
   * @param params Agent creation parameters
   * @returns Created agent
   */
  static async createAgent(params: AgentCreateParams): Promise<Agent> {
    try {
      const agentConfig: AgentConfig = {
        agent_type: params.type,
        name: params.name,
        config: params.config
      };
      
      const agent = await agentServiceClient.createAgent(agentConfig);
      
      // Map API response to our model
      return {
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }
  
  /**
   * Update an agent.
   * 
   * @param id Agent ID
   * @param params Agent update parameters
   * @returns Updated agent
   */
  static async updateAgent(id: string, params: AgentUpdateParams): Promise<Agent> {
    try {
      const agentConfig: AgentConfigUpdate = {};
      
      if (params.name) {
        agentConfig.name = params.name;
      }
      
      if (params.config) {
        agentConfig.config = params.config;
      }
      
      const agent = await agentServiceClient.updateAgent(id, agentConfig);
      
      // Map API response to our model
      return {
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an agent.
   * 
   * @param id Agent ID
   * @returns True if successful
   */
  static async deleteAgent(id: string): Promise<boolean> {
    try {
      const response = await agentServiceClient.deleteAgent(id);
      return response.success;
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Start an agent.
   * 
   * @param id Agent ID
   * @returns Updated agent
   */
  static async startAgent(id: string): Promise<Agent> {
    try {
      const agent = await agentServiceClient.startAgent(id);
      
      // Map API response to our model
      return {
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    } catch (error) {
      console.error(`Error starting agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Stop an agent.
   * 
   * @param id Agent ID
   * @returns Updated agent
   */
  static async stopAgent(id: string): Promise<Agent> {
    try {
      const agent = await agentServiceClient.stopAgent(id);
      
      // Map API response to our model
      return {
        id: agent.agent_id,
        name: agent.name,
        type: agent.agent_type,
        status: agent.status,
        config: agent.config,
        metrics: agent.metrics,
        createdAt: agent.created_at,
        updatedAt: agent.updated_at
      };
    } catch (error) {
      console.error(`Error stopping agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get agent status.
   * 
   * @param id Agent ID
   * @returns Agent status
   */
  static async getAgentStatus(id: string): Promise<{ status: string; metrics?: Record<string, any> }> {
    try {
      const status = await agentServiceClient.getAgentStatus(id);
      
      return {
        status: status.status,
        metrics: status.metrics
      };
    } catch (error) {
      console.error(`Error getting agent status ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute an action on an agent.
   * 
   * @param id Agent ID
   * @param actionType Action type
   * @param parameters Action parameters
   * @returns Action response
   */
  static async executeAgentAction(id: string, actionType: string, parameters: Record<string, any> = {}): Promise<{ success: boolean; message?: string; data?: Record<string, any> }> {
    try {
      const action: AgentAction = {
        type: actionType,
        parameters
      };
      
      const response = await agentServiceClient.executeAgentAction(id, action);
      
      return {
        success: response.success,
        message: response.message,
        data: response.data
      };
    } catch (error) {
      console.error(`Error executing action on agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get agent logs.
   * 
   * @param id Agent ID
   * @param limit Maximum number of logs to return
   * @param level Filter logs by level
   * @returns List of log entries
   */
  static async getAgentLogs(id: string, limit: number = 100, level?: string): Promise<Array<{ timestamp: string; level: string; message: string }>> {
    try {
      const logs = await agentServiceClient.getAgentLogs(id, limit, level);
      
      return logs.map(log => ({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message
      }));
    } catch (error) {
      console.error(`Error getting agent logs ${id}:`, error);
      throw error;
    }
  }
}
