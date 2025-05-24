import { fetchApi } from './apiService';

// Types for trading agents
export interface TradingAgent {
  id: string;
  name: string;
  agent_type: string;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
  metrics?: {
    total_trades?: number;
    win_rate?: number;
    pnl?: number;
    uptime?: string;
    last_activity?: string;
  };
  logs?: LogEntry[];
}

export interface LogEntry {
  id: string;
  agent_id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentConfig {
  name: string;
  agent_type: string;
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

export interface AgentListResponse {
  agents: TradingAgent[];
  total: number;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Base URL for trading agents API
const TRADING_AGENTS_API_BASE = process.env.NODE_ENV === 'production'
  ? '/api/agents'  // Production API
  : '/api/agents'; // Development API

/**
 * Get all trading agents
 */
export const getTradingAgents = async (params?: {
  agent_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<AgentListResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.agent_type) queryParams.append('agent_type', params.agent_type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${TRADING_AGENTS_API_BASE}?${queryParams.toString()}`;

  return fetchApi<AgentListResponse>(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Get a specific trading agent by ID
 */
export const getTradingAgent = async (agentId: string): Promise<TradingAgent> => {
  return fetchApi<TradingAgent>(`${TRADING_AGENTS_API_BASE}/${agentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create a new trading agent
 */
export const createTradingAgent = async (agentConfig: AgentConfig): Promise<TradingAgent> => {
  return fetchApi<TradingAgent>(TRADING_AGENTS_API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentConfig),
  });
};

/**
 * Update a trading agent
 */
export const updateTradingAgent = async (
  agentId: string,
  updates: AgentConfigUpdate
): Promise<TradingAgent> => {
  return fetchApi<TradingAgent>(`${TRADING_AGENTS_API_BASE}/${agentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
};

/**
 * Delete a trading agent
 */
export const deleteTradingAgent = async (agentId: string): Promise<ActionResponse> => {
  return fetchApi<ActionResponse>(`${TRADING_AGENTS_API_BASE}/${agentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Start a trading agent
 */
export const startTradingAgent = async (agentId: string): Promise<TradingAgent> => {
  return fetchApi<TradingAgent>(`${TRADING_AGENTS_API_BASE}/${agentId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Stop a trading agent
 */
export const stopTradingAgent = async (agentId: string): Promise<TradingAgent> => {
  return fetchApi<TradingAgent>(`${TRADING_AGENTS_API_BASE}/${agentId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Get agent status
 */
export const getAgentStatus = async (agentId: string): Promise<any> => {
  return fetchApi<any>(`${TRADING_AGENTS_API_BASE}/${agentId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Execute an action on a trading agent
 */
export const executeAgentAction = async (
  agentId: string,
  action: AgentAction
): Promise<ActionResponse> => {
  return fetchApi<ActionResponse>(`${TRADING_AGENTS_API_BASE}/${agentId}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action),
  });
};

/**
 * Get agent logs
 */
export const getAgentLogs = async (
  agentId: string,
  params?: {
    limit?: number;
    level?: string;
    offset?: number;
  }
): Promise<LogEntry[]> => {
  const queryParams = new URLSearchParams();

  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.level) queryParams.append('level', params.level);
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const url = `${TRADING_AGENTS_API_BASE}/${agentId}/logs?${queryParams.toString()}`;

  return fetchApi<LogEntry[]>(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Create WebSocket connection for real-time agent updates
 */
export const createAgentWebSocket = (
  agentId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket => {
  const wsUrl = `ws://localhost:8000/agents/${agentId}/ws`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };

  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
    if (onClose) onClose(event);
  };

  return ws;
};

/**
 * Get available agent types
 */
export const getAgentTypes = async (): Promise<string[]> => {
  return fetchApi<string[]>(`${TRADING_AGENTS_API_BASE}/types`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Utility function to map Python bot files to agent types
 */
export const getPythonBotMapping = (): Record<string, {
  name: string;
  description: string;
  file: string;
  defaultConfig: Record<string, any>;
}> => {
  return {
    'copy_trading': {
      name: 'Copy Trading Bot',
      description: 'Automatically copies trades from successful wallets and smart money movements',
      file: 'copybot.py',
      defaultConfig: {
        max_positions: 10,
        usdc_size: 100,
        days_back: 1,
        tp_multiplier: 2.0,
        sl_percentage: -0.5
      }
    },
    'sol_scanner': {
      name: 'SOL Scanner',
      description: 'Scans for new token launches and trending tokens on Solana with quality filters',
      file: 'solscanner.py',
      defaultConfig: {
        new_token_hours: 3,
        min_liquidity: 10000,
        max_top10_holder_percent: 0.3,
        drop_if_no_website: false,
        drop_if_no_twitter: false
      }
    },
    'hyperliquid_trading': {
      name: 'HyperLiquid Trading Bot',
      description: 'Trades liquidations and market inefficiencies on HyperLiquid exchange',
      file: 'hyperliquid_trading_bot.py',
      defaultConfig: {
        order_usd_size: 10,
        leverage: 3,
        timeframe: '4h',
        symbols: ['WIF'],
        liquidation_threshold: 10000
      }
    },
    'sniper': {
      name: 'Sniper Bot',
      description: 'Snipes new token launches with advanced security checks and filters',
      file: 'sniperbot.py',
      defaultConfig: {
        usdc_size: 100,
        max_positions: 5,
        sell_at_multiple: 4.0,
        sell_amount_perc: 0.8,
        max_top10_holder_percent: 0.3,
        drop_if_mutable_metadata: true
      }
    }
  };
};

/**
 * Health check for trading agents service
 */
export const healthCheck = async (): Promise<{ status: string; service: string }> => {
  return fetchApi<{ status: string; service: string }>(`${TRADING_AGENTS_API_BASE}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
