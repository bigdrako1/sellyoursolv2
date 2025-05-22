/**
 * Tests for the AgentDetails component.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentDetails from '../AgentDetails';
import { Agent } from '../../../services/tradingAgentService';
import { useTradingAgentStore } from '../../../store/tradingAgentStore';

// Mock the trading agent store
jest.mock('../../../store/tradingAgentStore', () => ({
  useTradingAgentStore: jest.fn()
}));

// Mock the toast hook
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock the agent logs component
jest.mock('../AgentLogs', () => ({
  __esModule: true,
  default: () => <div data-testid="agent-logs">Agent Logs</div>
}));

// Mock the agent metrics component
jest.mock('../AgentMetrics', () => ({
  __esModule: true,
  default: () => <div data-testid="agent-metrics">Agent Metrics</div>
}));

// Mock the agent config component
jest.mock('../AgentConfig', () => ({
  __esModule: true,
  default: () => <div data-testid="agent-config">Agent Config</div>
}));

// Mock the agent actions component
jest.mock('../AgentActions', () => ({
  __esModule: true,
  default: () => <div data-testid="agent-actions">Agent Actions</div>
}));

// Mock the delete agent dialog
jest.mock('../DeleteAgentDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
    isOpen ? <div data-testid="delete-dialog">Delete Dialog</div> : null
  )
}));

// Mock the update agent dialog
jest.mock('../UpdateAgentDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
    isOpen ? <div data-testid="update-dialog">Update Dialog</div> : null
  )
}));

// Mock data
const mockAgent: Agent = {
  id: 'agent1',
  name: 'Copy Trading Agent',
  type: 'copy_trading',
  status: 'running',
  config: {
    tracked_wallets: ['wallet1', 'wallet2'],
    check_interval_minutes: 10
  },
  metrics: {
    profit_loss: {
      total_profit: 100,
      total_loss: 50,
      net_pnl: 50
    },
    counters: {
      positions_opened: 5,
      errors: 0
    },
    gauges: {
      last_cycle_completed: '2023-01-01T00:00:00Z',
      tracked_wallets_count: 2
    }
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

// Mock store functions
const mockStartAgent = jest.fn();
const mockStopAgent = jest.fn();
const mockFetchAgent = jest.fn();
const mockFetchAgentLogs = jest.fn();

describe('AgentDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the store
    (useTradingAgentStore as jest.Mock).mockReturnValue({
      startAgent: mockStartAgent,
      stopAgent: mockStopAgent,
      fetchAgent: mockFetchAgent,
      fetchAgentLogs: mockFetchAgentLogs,
      agentLogs: { agent1: [] },
      isLoadingLogs: false
    });
  });

  it('renders agent details correctly', () => {
    render(<AgentDetails agent={mockAgent} />);

    // Check for agent name
    expect(screen.getByText('Copy Trading Agent')).toBeInTheDocument();

    // Check for agent type
    expect(screen.getByText('Copy Trading Agent')).toBeInTheDocument();

    // Check for agent status
    expect(screen.getByText('running')).toBeInTheDocument();

    // Check for tabs
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /metrics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /config/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /actions/i })).toBeInTheDocument();
  });

  it('shows stop button for running agents', () => {
    render(<AgentDetails agent={mockAgent} />);

    // Check for stop button
    expect(screen.getByText('Stop Agent')).toBeInTheDocument();
    expect(screen.queryByText('Start Agent')).not.toBeInTheDocument();
  });

  it('shows start button for stopped agents', () => {
    const stoppedAgent = { ...mockAgent, status: 'stopped' };
    render(<AgentDetails agent={stoppedAgent} />);

    // Check for start button
    expect(screen.getByText('Start Agent')).toBeInTheDocument();
    expect(screen.queryByText('Stop Agent')).not.toBeInTheDocument();
  });

  it('calls startAgent when start button is clicked', async () => {
    const stoppedAgent = { ...mockAgent, status: 'stopped' };
    render(<AgentDetails agent={stoppedAgent} />);

    // Click the start button
    fireEvent.click(screen.getByText('Start Agent'));

    // Check that startAgent was called
    await waitFor(() => {
      expect(mockStartAgent).toHaveBeenCalledWith('agent1');
    });
  });

  it('calls stopAgent when stop button is clicked', async () => {
    render(<AgentDetails agent={mockAgent} />);

    // Click the stop button
    fireEvent.click(screen.getByText('Stop Agent'));

    // Check that stopAgent was called
    await waitFor(() => {
      expect(mockStopAgent).toHaveBeenCalledWith('agent1');
    });
  });

  it('opens delete dialog when delete button is clicked', () => {
    render(<AgentDetails agent={mockAgent} />);

    // Click the delete button
    fireEvent.click(screen.getByLabelText('Delete'));

    // Check that delete dialog is shown
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('opens update dialog when settings button is clicked', () => {
    render(<AgentDetails agent={mockAgent} />);

    // Click the settings button
    fireEvent.click(screen.getByLabelText('Settings'));

    // Check that update dialog is shown
    expect(screen.getByTestId('update-dialog')).toBeInTheDocument();
  });

  it('switches tabs when tab is clicked', () => {
    render(<AgentDetails agent={mockAgent} />);

    // Initially, the overview tab should be active
    expect(screen.getByTestId('agent-metrics')).toBeInTheDocument();

    // Click the logs tab
    fireEvent.click(screen.getByRole('tab', { name: /logs/i }));

    // Check that logs component is shown
    expect(screen.getByTestId('agent-logs')).toBeInTheDocument();

    // Click the config tab
    fireEvent.click(screen.getByRole('tab', { name: /config/i }));

    // Check that config component is shown
    expect(screen.getByTestId('agent-config')).toBeInTheDocument();

    // Click the actions tab
    fireEvent.click(screen.getByRole('tab', { name: /actions/i }));

    // Check that actions component is shown
    expect(screen.getByTestId('agent-actions')).toBeInTheDocument();
  });
});
