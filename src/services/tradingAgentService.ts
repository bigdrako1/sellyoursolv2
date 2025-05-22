/**
 * Service for interacting with the Trading Agent API.
 */
import axios, { AxiosInstance } from 'axios';
import { secureApiService } from './secureApiService';

// Types
export interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
  config: Record<string, any>;
  metrics?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentType {
  type: string;
  description: string;
  configSchema?: Record<string, any>;
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

export interface AgentStatus {
  status: string;
  metrics?: Record<string, any>;
}

export interface AgentLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface AgentAction {
  type: string;
  parameters?: Record<string, any>;
}

export interface AgentActionResponse {
  success: boolean;
  message?: string;
  data?: Record<string, any>;
}

class TradingAgentService {
  private apiClient: AxiosInstance;
  private wsConnections: Map<string, WebSocket> = new Map();
  
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${import.meta.env.VITE_API_URL || ''}/api/agents`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      async (config) => {
        const token = await secureApiService.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  /**
   * Get all agents.
   */
  async getAgents(): Promise<Agent[]> {
    try {
      const response = await this.apiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  }
  
  /**
   * Get agent by ID.
   */
  async getAgent(id: string): Promise<Agent> {
    try {
      const response = await this.apiClient.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new agent.
   */
  async createAgent(params: AgentCreateParams): Promise<Agent> {
    try {
      const response = await this.apiClient.post('/', params);
      return response.data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }
  
  /**
   * Update an agent.
   */
  async updateAgent(id: string, params: AgentUpdateParams): Promise<Agent> {
    try {
      const response = await this.apiClient.put(`/${id}`, params);
      return response.data;
    } catch (error) {
      console.error(`Error updating agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an agent.
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      await this.apiClient.delete(`/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Start an agent.
   */
  async startAgent(id: string): Promise<Agent> {
    try {
      const response = await this.apiClient.post(`/${id}/start`);
      return response.data;
    } catch (error) {
      console.error(`Error starting agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Stop an agent.
   */
  async stopAgent(id: string): Promise<Agent> {
    try {
      const response = await this.apiClient.post(`/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error(`Error stopping agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get agent status.
   */
  async getAgentStatus(id: string): Promise<AgentStatus> {
    try {
      const response = await this.apiClient.get(`/${id}/status`);
      return response.data;
    } catch (error) {
      console.error(`Error getting agent status ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get agent logs.
   */
  async getAgentLogs(id: string, limit: number = 100, level?: string): Promise<AgentLog[]> {
    try {
      const params: Record<string, any> = { limit };
      if (level) {
        params.level = level;
      }
      
      const response = await this.apiClient.get(`/${id}/logs`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error getting agent logs ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute an action on an agent.
   */
  async executeAgentAction(id: string, action: AgentAction): Promise<AgentActionResponse> {
    try {
      const response = await this.apiClient.post(`/${id}/execute`, action);
      return response.data;
    } catch (error) {
      console.error(`Error executing action on agent ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get available agent types.
   */
  async getAgentTypes(): Promise<AgentType[]> {
    try {
      const response = await this.apiClient.get('/agent-types');
      return response.data.agent_types;
    } catch (error) {
      console.error('Error fetching agent types:', error);
      throw error;
    }
  }
  
  /**
   * Get agent type details.
   */
  async getAgentType(type: string): Promise<AgentType> {
    try {
      const response = await this.apiClient.get(`/agent-types/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent type ${type}:`, error);
      throw error;
    }
  }
  
  /**
   * Connect to agent WebSocket for real-time updates.
   */
  connectToAgentWebSocket(id: string, onMessage: (data: any) => void): WebSocket {
    // Close existing connection if any
    if (this.wsConnections.has(id)) {
      this.wsConnections.get(id)?.close();
    }
    
    // Create new WebSocket connection
    const wsUrl = `${import.meta.env.VITE_WS_URL || window.location.origin.replace(/^http/, 'ws')}/api/agents/${id}/ws`;
    const ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log(`WebSocket connection opened for agent ${id}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error(`Error parsing WebSocket message for agent ${id}:`, error);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`WebSocket error for agent ${id}:`, error);
    };
    
    ws.onclose = () => {
      console.log(`WebSocket connection closed for agent ${id}`);
      this.wsConnections.delete(id);
    };
    
    // Store WebSocket connection
    this.wsConnections.set(id, ws);
    
    return ws;
  }
  
  /**
   * Disconnect from agent WebSocket.
   */
  disconnectFromAgentWebSocket(id: string): void {
    if (this.wsConnections.has(id)) {
      this.wsConnections.get(id)?.close();
      this.wsConnections.delete(id);
    }
  }
  
  /**
   * Disconnect from all WebSockets.
   */
  disconnectFromAllWebSockets(): void {
    for (const [id, ws] of this.wsConnections.entries()) {
      ws.close();
      this.wsConnections.delete(id);
    }
  }
}

export const tradingAgentService = new TradingAgentService();
