import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import TokenDetails from './TokenDetails';

// Mock window.open
const windowOpenMock = vi.fn();
Object.defineProperty(window, 'open', {
  value: windowOpenMock,
});

// Mock navigator.clipboard.writeText
const clipboardWriteTextMock = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: clipboardWriteTextMock,
  },
});

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TokenDetails', () => {
  const mockProps = {
    tokenAddress: 'So11111111111111111111111111111111111111112',
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<TokenDetails {...mockProps} />);

    // Check for loading indicators
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Wait for the component to finish "loading" the mock data
    waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('renders token details after loading', async () => {
    render(<TokenDetails {...mockProps} />);

    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Sample Token')).toBeInTheDocument();
    });

    // Check for token details
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Market Cap')).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    render(<TokenDetails {...mockProps} />);

    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Sample Token')).toBeInTheDocument();
    });

    // Switch to Metrics tab
    fireEvent.click(screen.getByRole('tab', { name: 'Metrics' }));

    // Wait for the tab content to update
    await waitFor(() => {
      expect(screen.getByText(/metrics chart/i)).toBeInTheDocument();
    });

    // Switch to Holders tab
    fireEvent.click(screen.getByRole('tab', { name: 'Holders' }));

    // Wait for the tab content to update
    await waitFor(() => {
      expect(screen.getByText('Top Holders')).toBeInTheDocument();
    });
  });

  it('copies token address to clipboard', async () => {
    render(<TokenDetails {...mockProps} />);

    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Sample Token')).toBeInTheDocument();
    });

    // Find and click the copy button
    const copyButton = screen.getByRole('button', { name: '' });
    fireEvent.click(copyButton);

    // Check if clipboard.writeText was called with the correct address
    expect(clipboardWriteTextMock).toHaveBeenCalledWith(mockProps.tokenAddress);
  });

  it('opens explorer when View on Explorer button is clicked', async () => {
    render(<TokenDetails {...mockProps} />);

    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Sample Token')).toBeInTheDocument();
    });

    // Find and click the View on Explorer button
    const viewOnExplorerButton = screen.getAllByText('View on Explorer')[0];
    fireEvent.click(viewOnExplorerButton);

    // Check if window.open was called with the correct URL
    expect(windowOpenMock).toHaveBeenCalledWith(
      `https://birdeye.so/token/${mockProps.tokenAddress}?chain=solana`,
      '_blank'
    );
  });

  it('opens trading page when Trade Token button is clicked', async () => {
    render(<TokenDetails {...mockProps} />);

    // Wait for the mock data to load
    await waitFor(() => {
      expect(screen.getByText('Sample Token')).toBeInTheDocument();
    });

    // Find and click the Trade Token button
    const tradeTokenButton = screen.getByText('Trade Token');
    fireEvent.click(tradeTokenButton);

    // Check if window.open was called with the correct URL
    expect(windowOpenMock).toHaveBeenCalledWith(
      `https://jup.ag/swap/SOL-${mockProps.tokenAddress}`,
      '_blank'
    );
  });
});
