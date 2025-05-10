import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StrategyMonitor from '../components/StrategyMonitor';

// Mock the recharts components
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="line-chart">{children}</div>
    ),
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Line: () => <div data-testid="line" />,
    Area: () => <div data-testid="area" />,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

// Mock the hooks
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('StrategyMonitor Component', () => {
  it('renders without crashing', () => {
    render(<StrategyMonitor />);
    expect(screen.getByText('Strategy Monitoring & Adaptation')).toBeInTheDocument();
  });
  
  it('displays strategy tabs', () => {
    render(<StrategyMonitor />);
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /optimization/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
  });
  
  it('displays strategy cards in overview tab', () => {
    render(<StrategyMonitor />);
    expect(screen.getByText('Front Running AI')).toBeInTheDocument();
    expect(screen.getByText('Market Runner Detection')).toBeInTheDocument();
    expect(screen.getByText('Wallet Activity Tracker')).toBeInTheDocument();
  });
  
  it('allows toggling strategy status', () => {
    const onStrategyUpdate = vi.fn();
    render(<StrategyMonitor onStrategyUpdate={onStrategyUpdate} />);
    
    // Find the switch for the first strategy
    const switches = screen.getAllByRole('switch');
    fireEvent.click(switches[0]);
    
    // Check if the callback was called
    expect(onStrategyUpdate).toHaveBeenCalled();
  });
  
  it('switches between tabs', () => {
    render(<StrategyMonitor />);
    
    // Click on the performance tab
    fireEvent.click(screen.getByRole('tab', { name: /performance/i }));
    expect(screen.getByText('Strategy Performance Comparison')).toBeInTheDocument();
    
    // Click on the optimization tab
    fireEvent.click(screen.getByRole('tab', { name: /optimization/i }));
    expect(screen.getByText('Expected improvement:')).toBeInTheDocument();
    
    // Click on the settings tab
    fireEvent.click(screen.getByRole('tab', { name: /settings/i }));
    expect(screen.getByText('Select a strategy to configure its settings.')).toBeInTheDocument();
  });
});
