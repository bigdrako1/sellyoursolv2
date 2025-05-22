/**
 * Tests for the tradingAgentService.
 */
import axios from 'axios';
import { tradingAgentService } from '../tradingAgentService';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      }
    }
  }))
}));

// Mock secureApiService
jest.mock('../secureApiService', () => ({
  secureApiService: {
    getAuthToken: jest.fn().mockResolvedValue('mock-token')
  }
}));

describe('tradingAgentService', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = (axios.create as jest.Mock).mock.results[0].value;
  });

  describe('getAgents', () => {
    it('should call the correct endpoint and return agents', async () => {
      const mockAgents = [
        { id: 'agent1', name: 'Agent 1' },
        { id: 'agent2', name: 'Agent 2' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockAgents });
      
      const result = await tradingAgentService.getAgents();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/');
      expect(result).toEqual(mockAgents);
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValueOnce(error);
      
      await expect(tradingAgentService.getAgents()).rejects.toThrow('Network error');
    });
  });

  describe('getAgent', () => {
    it('should call the correct endpoint and return an agent', async () => {
      const mockAgent = { id: 'agent1', name: 'Agent 1' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockAgent });
      
      const result = await tradingAgentService.getAgent('agent1');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/agent1');
      expect(result).toEqual(mockAgent);
    });
  });

  describe('createAgent', () => {
    it('should call the correct endpoint and return the created agent', async () => {
      const mockAgent = { id: 'agent1', name: 'Agent 1' };
      const params = { name: 'Agent 1', type: 'copy_trading', config: {} };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockAgent });
      
      const result = await tradingAgentService.createAgent(params);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/', params);
      expect(result).toEqual(mockAgent);
    });
  });

  describe('updateAgent', () => {
    it('should call the correct endpoint and return the updated agent', async () => {
      const mockAgent = { id: 'agent1', name: 'Updated Agent' };
      const params = { name: 'Updated Agent' };
      
      mockAxiosInstance.put.mockResolvedValueOnce({ data: mockAgent });
      
      const result = await tradingAgentService.updateAgent('agent1', params);
      
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/agent1', params);
      expect(result).toEqual(mockAgent);
    });
  });

  describe('deleteAgent', () => {
    it('should call the correct endpoint', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({});
      
      const result = await tradingAgentService.deleteAgent('agent1');
      
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/agent1');
      expect(result).toBe(true);
    });
  });

  describe('startAgent', () => {
    it('should call the correct endpoint and return the started agent', async () => {
      const mockAgent = { id: 'agent1', status: 'running' };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockAgent });
      
      const result = await tradingAgentService.startAgent('agent1');
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/agent1/start');
      expect(result).toEqual(mockAgent);
    });
  });

  describe('stopAgent', () => {
    it('should call the correct endpoint and return the stopped agent', async () => {
      const mockAgent = { id: 'agent1', status: 'stopped' };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockAgent });
      
      const result = await tradingAgentService.stopAgent('agent1');
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/agent1/stop');
      expect(result).toEqual(mockAgent);
    });
  });

  describe('getAgentStatus', () => {
    it('should call the correct endpoint and return the agent status', async () => {
      const mockStatus = { status: 'running', metrics: {} };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockStatus });
      
      const result = await tradingAgentService.getAgentStatus('agent1');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/agent1/status');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getAgentLogs', () => {
    it('should call the correct endpoint and return the agent logs', async () => {
      const mockLogs = [
        { timestamp: '2023-01-01T00:00:00Z', level: 'info', message: 'Log 1' },
        { timestamp: '2023-01-01T00:01:00Z', level: 'error', message: 'Log 2' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockLogs });
      
      const result = await tradingAgentService.getAgentLogs('agent1', 100, 'info');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/agent1/logs', { params: { limit: 100, level: 'info' } });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('executeAgentAction', () => {
    it('should call the correct endpoint and return the action response', async () => {
      const mockResponse = { success: true, message: 'Action executed' };
      const action = { type: 'add_wallet', parameters: { wallet: 'wallet1' } };
      
      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await tradingAgentService.executeAgentAction('agent1', action);
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/agent1/execute', action);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getAgentTypes', () => {
    it('should call the correct endpoint and return the agent types', async () => {
      const mockAgentTypes = [
        { type: 'copy_trading', description: 'Copy Trading Agent' },
        { type: 'liquidation', description: 'Liquidation Agent' }
      ];
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { agent_types: mockAgentTypes } });
      
      const result = await tradingAgentService.getAgentTypes();
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/agent-types');
      expect(result).toEqual(mockAgentTypes);
    });
  });

  describe('getAgentType', () => {
    it('should call the correct endpoint and return the agent type', async () => {
      const mockAgentType = { type: 'copy_trading', description: 'Copy Trading Agent' };
      
      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockAgentType });
      
      const result = await tradingAgentService.getAgentType('copy_trading');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/agent-types/copy_trading');
      expect(result).toEqual(mockAgentType);
    });
  });
});
