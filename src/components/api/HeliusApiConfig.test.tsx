import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import HeliusApiConfig from './HeliusApiConfig';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('HeliusApiConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders the component correctly without API key', () => {
    render(<HeliusApiConfig />);

    expect(screen.getByText('Helius API Configuration')).toBeInTheDocument();
    expect(screen.getByText('Configure your Helius API key for real-time token monitoring')).toBeInTheDocument();
    expect(screen.getByLabelText('Helius API Key')).toBeInTheDocument();
    expect(screen.getByText('Save API Key')).toBeInTheDocument();
  });

  it('shows API key configured view when API key exists', () => {
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');

    render(<HeliusApiConfig />);

    expect(screen.getByText('API Key Configured Successfully')).toBeInTheDocument();
    expect(screen.getByText('Reset API Key')).toBeInTheDocument();
  });

  it('handles API key submission', async () => {
    render(<HeliusApiConfig />);

    const input = screen.getByLabelText('Helius API Key');
    const submitButton = screen.getByText('Save API Key');

    fireEvent.change(input, { target: { value: 'test-api-key-12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('helius_api_key', 'test-api-key-12345');
    });
  });

  it('handles API key reset', async () => {
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');

    render(<HeliusApiConfig />);

    const resetButton = screen.getByText('Reset API Key');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('helius_api_key');
    });
  });

  it('renders compact version when compact prop is true and API key exists', () => {
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');

    render(<HeliusApiConfig compact={true} />);

    expect(screen.getByText('Helius API: Connected')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('calls onApiKeySet callback when API key is set', async () => {
    const onApiKeySet = vi.fn();

    render(<HeliusApiConfig onApiKeySet={onApiKeySet} />);

    const input = screen.getByLabelText('Helius API Key');
    const submitButton = screen.getByText('Save API Key');

    fireEvent.change(input, { target: { value: 'test-api-key-12345' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onApiKeySet).toHaveBeenCalledWith('test-api-key-12345');
    });
  });
});
