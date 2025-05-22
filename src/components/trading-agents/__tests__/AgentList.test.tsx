/**
 * Tests for the AgentList component.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import AgentList from '../AgentList';
import { Agent } from '../../../services/tradingAgentService';

// Mock data
const mockAgents: Agent[] = [
  {
    id: 'agent1',
    name: 'Copy Trading Agent',
    type: 'copy_trading',
    status: 'running',
    config: {},
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'agent2',
    name: 'Liquidation Agent',
    type: 'liquidation',
    status: 'stopped',
    config: {},
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Mock functions
const mockOnSelectAgent = jest.fn();

describe('AgentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    render(
      <AgentList
        agents={[]}
        selectedAgentId={null}
        isLoading={true}
        onSelectAgent={mockOnSelectAgent}
      />
    );

    // Check for loading skeletons
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('renders empty state correctly', () => {
    render(
      <AgentList
        agents={[]}
        selectedAgentId={null}
        isLoading={false}
        onSelectAgent={mockOnSelectAgent}
      />
    );

    // Check for empty state message
    expect(screen.getByText(/No agents found/i)).toBeInTheDocument();
  });

  it('renders agents correctly', () => {
    render(
      <AgentList
        agents={mockAgents}
        selectedAgentId={null}
        isLoading={false}
        onSelectAgent={mockOnSelectAgent}
      />
    );

    // Check for agent names
    expect(screen.getByText('Copy Trading Agent')).toBeInTheDocument();
    expect(screen.getByText('Liquidation Agent')).toBeInTheDocument();

    // Check for agent types
    expect(screen.getByText('Copy Trading')).toBeInTheDocument();
    expect(screen.getByText('Liquidation')).toBeInTheDocument();

    // Check for agent statuses
    expect(screen.getByText('running')).toBeInTheDocument();
    expect(screen.getByText('stopped')).toBeInTheDocument();
  });

  it('calls onSelectAgent when an agent is clicked', () => {
    render(
      <AgentList
        agents={mockAgents}
        selectedAgentId={null}
        isLoading={false}
        onSelectAgent={mockOnSelectAgent}
      />
    );

    // Click on the first agent
    fireEvent.click(screen.getByText('Copy Trading Agent'));

    // Check that onSelectAgent was called with the correct agent ID
    expect(mockOnSelectAgent).toHaveBeenCalledWith('agent1');
  });

  it('highlights the selected agent', () => {
    render(
      <AgentList
        agents={mockAgents}
        selectedAgentId="agent1"
        isLoading={false}
        onSelectAgent={mockOnSelectAgent}
      />
    );

    // Check that the first agent has the selected class
    const agentElement = screen.getByText('Copy Trading Agent').closest('div');
    expect(agentElement).toHaveClass('bg-primary/10');
  });
});
