import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTokenStore } from '../tokenStore';
import { getRecentTokenActivity, getTrendingTokens, getPumpFunTokens } from '@/services/tokenDataService';
import { errorHandler } from '@/utils/errorUtils';

// Mock the token data service
vi.mock('@/services/tokenDataService', () => ({
  getRecentTokenActivity: vi.fn(),
  getTrendingTokens: vi.fn(),
  getPumpFunTokens: vi.fn(),
  tokenInfoToToken: vi.fn((token) => token)
}));

// Mock the error handler
vi.mock('@/utils/errorUtils', () => ({
  errorHandler: {
    handleError: vi.fn(),
    reportError: vi.fn()
  }
}));

describe('Token Store', () => {
  beforeEach(() => {
    // Reset the store to its initial state
    const { clearErrors } = useTokenStore.getState();
    useTokenStore.setState({
      tokens: [],
      trendingTokens: [],
      pumpFunTokens: [],
      watchlist: [],
      isLoading: false,
      isTrendingLoading: false,
      isPumpFunLoading: false,
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
    const state = useTokenStore.getState();
    
    expect(state.tokens).toEqual([]);
    expect(state.trendingTokens).toEqual([]);
    expect(state.pumpFunTokens).toEqual([]);
    expect(state.watchlist).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.isTrendingLoading).toBe(false);
    expect(state.isPumpFunLoading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  it('should fetch tokens successfully', async () => {
    // Mock the token data
    const mockTokens = [
      { address: 'token1', name: 'Token 1', symbol: 'TKN1', price: 1.0 },
      { address: 'token2', name: 'Token 2', symbol: 'TKN2', price: 2.0 }
    ];
    
    // Set up the mock implementation
    (getRecentTokenActivity as any).mockResolvedValue(mockTokens);
    
    // Get the fetchTokens action from the store
    const { fetchTokens } = useTokenStore.getState();
    
    // Call the action
    await fetchTokens();
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the state was updated correctly
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Verify the mock was called
    expect(getRecentTokenActivity).toHaveBeenCalledTimes(1);
  });
  
  it('should handle errors when fetching tokens', async () => {
    // Set up the mock to throw an error
    const mockError = new Error('Failed to fetch tokens');
    (getRecentTokenActivity as any).mockRejectedValue(mockError);
    
    // Get the fetchTokens action from the store
    const { fetchTokens } = useTokenStore.getState();
    
    // Call the action
    await fetchTokens();
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the state was updated correctly
    expect(state.tokens).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Failed to fetch tokens');
    
    // Verify the error handler was called
    expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
    expect(errorHandler.handleError).toHaveBeenCalledWith(mockError, 'fetchTokens');
  });
  
  it('should fetch trending tokens successfully', async () => {
    // Mock the token data
    const mockTrendingTokens = [
      { address: 'trending1', name: 'Trending 1', symbol: 'TRD1', price: 1.0 },
      { address: 'trending2', name: 'Trending 2', symbol: 'TRD2', price: 2.0 }
    ];
    
    // Set up the mock implementation
    (getTrendingTokens as any).mockResolvedValue(mockTrendingTokens);
    
    // Get the fetchTrendingTokens action from the store
    const { fetchTrendingTokens } = useTokenStore.getState();
    
    // Call the action
    await fetchTrendingTokens();
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the state was updated correctly
    expect(state.trendingTokens).toEqual(mockTrendingTokens);
    expect(state.isTrendingLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Verify the mock was called
    expect(getTrendingTokens).toHaveBeenCalledTimes(1);
  });
  
  it('should fetch pump.fun tokens successfully', async () => {
    // Mock the token data
    const mockPumpTokens = [
      { address: 'pump1', name: 'Pump 1', symbol: 'PMP1', price: 1.0 },
      { address: 'pump2', name: 'Pump 2', symbol: 'PMP2', price: 2.0 }
    ];
    
    // Set up the mock implementation
    (getPumpFunTokens as any).mockResolvedValue(mockPumpTokens);
    
    // Get the fetchPumpFunTokens action from the store
    const { fetchPumpFunTokens } = useTokenStore.getState();
    
    // Call the action
    await fetchPumpFunTokens();
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the state was updated correctly
    expect(state.pumpFunTokens).toEqual(mockPumpTokens);
    expect(state.isPumpFunLoading).toBe(false);
    expect(state.error).toBeNull();
    
    // Verify the mock was called
    expect(getPumpFunTokens).toHaveBeenCalledTimes(1);
  });
  
  it('should add token to watchlist', () => {
    // Create a token to add to the watchlist
    const token = { 
      address: 'token1', 
      name: 'Token 1', 
      symbol: 'TKN1', 
      price: 1.0,
      marketCap: 1000000,
      volume24h: 500000,
      priceChange24h: 5.0
    };
    
    // Get the addToWatchlist action from the store
    const { addToWatchlist } = useTokenStore.getState();
    
    // Call the action
    addToWatchlist(token);
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the state was updated correctly
    expect(state.watchlist).toEqual([token]);
    
    // Add the same token again (should not duplicate)
    addToWatchlist(token);
    
    // Get the updated state
    const stateAfterDuplicate = useTokenStore.getState();
    
    // Verify the state was not changed (no duplicates)
    expect(stateAfterDuplicate.watchlist).toEqual([token]);
  });
  
  it('should remove token from watchlist', () => {
    // Create tokens to add to the watchlist
    const token1 = { 
      address: 'token1', 
      name: 'Token 1', 
      symbol: 'TKN1', 
      price: 1.0,
      marketCap: 1000000,
      volume24h: 500000,
      priceChange24h: 5.0
    };
    
    const token2 = { 
      address: 'token2', 
      name: 'Token 2', 
      symbol: 'TKN2', 
      price: 2.0,
      marketCap: 2000000,
      volume24h: 1000000,
      priceChange24h: -2.0
    };
    
    // Get the actions from the store
    const { addToWatchlist, removeFromWatchlist } = useTokenStore.getState();
    
    // Add tokens to the watchlist
    addToWatchlist(token1);
    addToWatchlist(token2);
    
    // Verify both tokens are in the watchlist
    expect(useTokenStore.getState().watchlist).toEqual([token1, token2]);
    
    // Remove token1 from the watchlist
    removeFromWatchlist(token1.address);
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify token1 was removed
    expect(state.watchlist).toEqual([token2]);
  });
  
  it('should clear errors', () => {
    // Set an error in the state
    useTokenStore.setState({ error: 'Test error' });
    
    // Verify the error is set
    expect(useTokenStore.getState().error).toBe('Test error');
    
    // Get the clearErrors action from the store
    const { clearErrors } = useTokenStore.getState();
    
    // Call the action
    clearErrors();
    
    // Get the updated state
    const state = useTokenStore.getState();
    
    // Verify the error was cleared
    expect(state.error).toBeNull();
  });
});
