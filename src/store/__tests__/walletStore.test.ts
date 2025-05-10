import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useWalletStore } from '../walletStore';
import { getWalletBalances, getWalletTransactions } from '@/utils/walletUtils';
import { errorHandler } from '@/utils/errorUtils';

// Mock the wallet utils
vi.mock('@/utils/walletUtils', () => ({
  getWalletBalances: vi.fn(),
  getWalletTransactions: vi.fn()
}));

// Mock the error handler
vi.mock('@/utils/errorUtils', () => ({
  errorHandler: {
    handleError: vi.fn(),
    reportError: vi.fn()
  }
}));

describe('Wallet Store', () => {
  beforeEach(() => {
    // Reset the store to its initial state
    useWalletStore.setState({
      walletData: null,
      trackedWallets: [],
      transactions: [],
      isLoading: false,
      isTransactionsLoading: false,
      error: null
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });
  
  it('should initialize with default values', () => {
    const state = useWalletStore.getState();
    
    expect(state.walletData).toBeNull();
    expect(state.trackedWallets).toEqual([]);
    expect(state.transactions).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isTransactionsLoading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should fetch wallet data successfully', async () => {
    // Mock wallet data
    const mockWalletData = {
      address: 'wallet123',
      balance: 5.23,
      tokens: [
        { symbol: 'SOL', name: 'Solana', mint: 'sol123', amount: 5.23, decimals: 9, usdValue: 150.75 }
      ],
      totalUsdValue: 150.75
    };
    
    // Set up the mock implementation
    (getWalletBalances as any).mockResolvedValue(mockWalletData);
    
    // Get the fetchWalletData action from the store
    const { fetchWalletData } = useWalletStore.getState();
    
    // Call the action
    await fetchWalletData('wallet123');
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify the state was updated correctly
    expect(state.walletData).toEqual(mockWalletData);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Verify the mock was called
    expect(getWalletBalances).toHaveBeenCalledTimes(1);
    expect(getWalletBalances).toHaveBeenCalledWith('wallet123');
  });
  
  it('should handle errors when fetching wallet data', async () => {
    // Set up the mock to throw an error
    const mockError = new Error('Failed to fetch wallet data');
    (getWalletBalances as any).mockRejectedValue(mockError);
    
    // Get the fetchWalletData action from the store
    const { fetchWalletData } = useWalletStore.getState();
    
    // Call the action
    await fetchWalletData('wallet123');
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify the state was updated correctly
    expect(state.walletData).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to fetch wallet data');
    
    // Verify the error handler was called
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
    expect(errorHandler.handleError).toHaveBeenCalledWith(mockError, 'fetchWalletData');
  });
  
  it('should fetch wallet transactions successfully', async () => {
    // Mock wallet transactions
    const mockTransactions = [
      { 
        signature: 'tx1', 
        timestamp: 1623456789, 
        slot: 123456, 
        success: true, 
        fee: 0.000005, 
        type: 'TRANSFER' 
      },
      { 
        signature: 'tx2', 
        timestamp: 1623456790, 
        slot: 123457, 
        success: true, 
        fee: 0.000005, 
        type: 'SWAP' 
      }
    ];
    
    // Set up the mock implementation
    (getWalletTransactions as any).mockResolvedValue(mockTransactions);
    
    // Get the fetchWalletTransactions action from the store
    const { fetchWalletTransactions } = useWalletStore.getState();
    
    // Call the action
    await fetchWalletTransactions('wallet123');
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify the state was updated correctly
    expect(state.transactions).toEqual(mockTransactions);
    expect(state.isTransactionsLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Verify the mock was called
    expect(getWalletTransactions).toHaveBeenCalledTimes(1);
    expect(getWalletTransactions).toHaveBeenCalledWith('wallet123');
  });
  
  it('should add wallet to tracked wallets', () => {
    // Get the addTrackedWallet action from the store
    const { addTrackedWallet } = useWalletStore.getState();
    
    // Call the action
    addTrackedWallet('wallet123');
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify the state was updated correctly
    expect(state.trackedWallets).toEqual(['wallet123']);
    
    // Add the same wallet again (should not duplicate)
    addTrackedWallet('wallet123');
    
    // Get the updated state
    const stateAfterDuplicate = useWalletStore.getState();
    
    // Verify the state was not changed (no duplicates)
    expect(stateAfterDuplicate.trackedWallets).toEqual(['wallet123']);
    
    // Add another wallet
    addTrackedWallet('wallet456');
    
    // Get the updated state
    const stateAfterSecondWallet = useWalletStore.getState();
    
    // Verify the state was updated correctly
    expect(stateAfterSecondWallet.trackedWallets).toEqual(['wallet123', 'wallet456']);
  });
  
  it('should remove wallet from tracked wallets', () => {
    // Get the actions from the store
    const { addTrackedWallet, removeTrackedWallet } = useWalletStore.getState();
    
    // Add wallets to tracked wallets
    addTrackedWallet('wallet123');
    addTrackedWallet('wallet456');
    
    // Verify both wallets are tracked
    expect(useWalletStore.getState().trackedWallets).toEqual(['wallet123', 'wallet456']);
    
    // Remove wallet123 from tracked wallets
    removeTrackedWallet('wallet123');
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify wallet123 was removed
    expect(state.trackedWallets).toEqual(['wallet456']);
  });
  
  it('should clear errors', () => {
    // Set an error in the state
    useWalletStore.setState({ error: 'Test error' });
    
    // Verify the error is set
    expect(useWalletStore.getState().error).toBe('Test error');
    
    // Get the clearErrors action from the store
    const { clearErrors } = useWalletStore.getState();
    
    // Call the action
    clearErrors();
    
    // Get the updated state
    const state = useWalletStore.getState();
    
    // Verify the error was cleared
    expect(state.error).toBeNull();
  });
});
