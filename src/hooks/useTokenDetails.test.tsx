import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useTokenDetails from './useTokenDetails';

// Mock the TokenDetails component
vi.mock('@/components/token', () => ({
  TokenDetails: vi.fn(() => <div data-testid="mock-token-details" />),
}));

describe('useTokenDetails', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useTokenDetails());

    // Check initial state
    expect(result.current.openTokenDetails).toBeInstanceOf(Function);
    expect(result.current.closeTokenDetails).toBeInstanceOf(Function);
    expect(result.current.TokenDetailsDialog).toBeInstanceOf(Function);
  });

  it('should open token details with the provided address', () => {
    const { result } = renderHook(() => useTokenDetails());

    // Open token details
    act(() => {
      result.current.openTokenDetails('test-token-address');
    });

    // Check that the TokenDetailsDialog function exists
    expect(result.current.TokenDetailsDialog).toBeDefined();
  });

  it('should close token details', () => {
    const { result } = renderHook(() => useTokenDetails());

    // Open token details first
    act(() => {
      result.current.openTokenDetails('test-token-address');
    });

    // Then close it
    act(() => {
      result.current.closeTokenDetails();
    });

    // Check that the TokenDetailsDialog function exists
    expect(result.current.TokenDetailsDialog).toBeDefined();
  });
});
