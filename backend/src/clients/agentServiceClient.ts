/**
 * Client for the Trading Agent Service API.
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export interface AgentConfig {
  agent_type: string;
  name: string;
  config: Record<string, any>;
}

export interface AgentConfigUpdate {
  name?: string;
  config?: Record<string, any>;
}

export interface AgentAction {
  type: string;
  parameters: Record<string, any>;
}

export interface AgentStatus {
  agent_id: string;
  status: string;
  metrics?: Record<string, any>;
  config: Record<string, any>;
}

export interface AgentLogEntry {
  timestamp: string;
  agent_id: string;
  level: string;
  message: string;
}

export interface AgentResponse {
  agent_id: string;
  name: string;
  agent_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
  metrics?: Record<string, any>;
  logs?: AgentLogEntry[];
}

export interface AgentListResponse {
  agents: AgentResponse[];
  total: number;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  data?: Record<string, any>;
}

export class AgentServiceClient extends EventEmitter {
  private readonly baseUrl: string;
  private readonly httpClient: AxiosInstance;
  private webSockets: Map<string, WebSocket> = new Map();

  /**
   * Create a new AgentServiceClient.
   * 
   * @param baseUrl Base URL of the Trading Agent Service API
   * @param config Axios request configuration
   */
  constructor(baseUrl: string, config?: AxiosRequestConfig) {
    super();
    this.baseUrl = baseUrl;
    this.httpClient = axios.create({
      baseURL: baseUrl,
      ...config
    });
  }

  /**
   * Create a new agent.
   * 
   * @param agentConfig Agent configuration
   * @returns Created agent
   */
  async createAgent(agentConfig: AgentConfig): Promise<AgentResponse> {
    const response = await this.httpClient.post<AgentResponse>('/agents', agentConfig);
    return response.data;
  }

  /**
   * Get all agents.
   * 
   * @returns List of agents
   */
  async getAgents(): Promise<AgentListResponse> {
    const response = await this.httpClient.get<AgentListResponse>('/agents');
    return response.data;
  }

  /**
   * Get an agent by ID.
   * 
   * @param agentId Agent ID
   * @returns Agent details
   */
  async getAgent(agentId: string): Promise<AgentResponse> {
    const response = await this.httpClient.get<AgentResponse>(`/agents/${agentId}`);
    return response.data;
  }

  /**
   * Delete an agent.
   * 
   * @param agentId Agent ID
   * @returns Action response
   */
  async deleteAgent(agentId: string): Promise<ActionResponse> {
    const response = await this.httpClient.delete<ActionResponse>(`/agents/${agentId}`);
    return response.data;
  }

  /**
   * Update an agent.
   * 
   * @param agentId Agent ID
   * @param agentConfig Agent configuration update
   * @returns Updated agent
   */
  async updateAgent(agentId: string, agentConfig: AgentConfigUpdate): Promise<AgentResponse> {
    const response = await this.httpClient.put<AgentResponse>(`/agents/${agentId}`, agentConfig);
    return response.data;
  }

  /**
   * Start an agent.
   * 
   * @param agentId Agent ID
   * @returns Updated agent
   */
  async startAgent(agentId: string): Promise<AgentResponse> {
    const response = await this.httpClient.post<AgentResponse>(`/agents/${agentId}/start`);
    return response.data;
  }

  /**
   * Stop an agent.
   * 
   * @param agentId Agent ID
   * @returns Updated agent
   */
  async stopAgent(agentId: string): Promise<AgentResponse> {
    const response = await this.httpClient.post<AgentResponse>(`/agents/${agentId}/stop`);
    return response.data;
  }

  /**
   * Get agent status.
   * 
   * @param agentId Agent ID
   * @returns Agent status
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    const response = await this.httpClient.get<AgentStatus>(`/agents/${agentId}/status`);
    return response.data;
  }

  /**
   * Execute an action on an agent.
   * 
   * @param agentId Agent ID
   * @param action Action to execute
   * @returns Action response
   */
  async executeAgentAction(agentId: string, action: AgentAction): Promise<ActionResponse> {
    const response = await this.httpClient.post<ActionResponse>(`/agents/${agentId}/execute`, action);
    return response.data;
  }

  /**
   * Get agent logs.
   * 
   * @param agentId Agent ID
   * @param limit Maximum number of logs to return
   * @param level Filter logs by level
   * @returns List of log entries
   */
  async getAgentLogs(agentId: string, limit: number = 100, level?: string): Promise<AgentLogEntry[]> {
    const params: Record<string, any> = { limit };
    if (level) {
      params.level = level;
    }
    
    const response = await this.httpClient.get<AgentLogEntry[]>(`/agents/${agentId}/logs`, { params });
    return response.data;
  }

  /**
   * Connect to the WebSocket for real-time agent updates.
   * 
   * @param agentId Agent ID
   * @returns WebSocket connection
   */
  connectToAgentWebSocket(agentId: string): WebSocket {
    // Close existing connection if any
    if (this.webSockets.has(agentId)) {
      this.webSockets.get(agentId)?.close();
    }
    
    // Create new WebSocket connection
    const wsUrl = `${this.baseUrl.replace(/^http/, 'ws')}/agents/${agentId}/ws`;
    const ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    ws.on('open', () => {
      this.emit('ws:open', { agentId });
    });
    
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('ws:message', { agentId, message });
      } catch (error) {
        this.emit('ws:error', { agentId, error });
      }
    });
    
    ws.on('error', (error) => {
      this.emit('ws:error', { agentId, error });
    });
    
    ws.on('close', (code, reason) => {
      this.webSockets.delete(agentId);
      this.emit('ws:close', { agentId, code, reason });
    });
    
    // Store WebSocket connection
    this.webSockets.set(agentId, ws);
    
    return ws;
  }

  /**
   * Disconnect from the WebSocket.
   * 
   * @param agentId Agent ID
   */
  disconnectFromAgentWebSocket(agentId: string): void {
    if (this.webSockets.has(agentId)) {
      this.webSockets.get(agentId)?.close();
      this.webSockets.delete(agentId);
    }
  }

  /**
   * Disconnect from all WebSockets.
   */
  disconnectFromAllWebSockets(): void {
    for (const [agentId, ws] of this.webSockets.entries()) {
      ws.close();
      this.webSockets.delete(agentId);
    }
  }
}
