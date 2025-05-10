import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createSession, 
  getSession, 
  extendSession, 
  removeSession, 
  isSessionValid,
  getSessionTimeRemaining,
  formatSessionTimeRemaining,
  SESSION_TIMEOUT_MS
} from '../sessionUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Session Utils', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Mock Date.now() to return a fixed timestamp
    const now = new Date('2023-01-01T00:00:00Z').getTime();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });
  
  it('should create a session', () => {
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    const session = createSession(userId, walletAddress, walletProvider);
    
    expect(session).toEqual({
      userId,
      walletAddress,
      walletProvider,
      expiresAt: Date.now() + SESSION_TIMEOUT_MS
    });
    
    // Check if session was stored in localStorage
    const storedSession = localStorage.getItem('sys_session');
    expect(storedSession).not.toBeNull();
    
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      expect(parsedSession).toEqual(session);
    }
  });
  
  it('should get a valid session', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Get the session
    const session = getSession();
    
    expect(session).not.toBeNull();
    expect(session?.userId).toBe(userId);
    expect(session?.walletAddress).toBe(walletAddress);
    expect(session?.walletProvider).toBe(walletProvider);
  });
  
  it('should return null for expired session', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    // Create a session that is already expired
    const expiredSession = {
      userId,
      walletAddress,
      walletProvider,
      expiresAt: Date.now() - 1000 // Expired 1 second ago
    };
    
    localStorage.setItem('sys_session', JSON.stringify(expiredSession));
    
    // Get the session
    const session = getSession();
    
    // Should return null for expired session
    expect(session).toBeNull();
    
    // Should remove expired session from localStorage
    expect(localStorage.getItem('sys_session')).toBeNull();
  });
  
  it('should extend session expiration', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Get original expiration time
    const originalSession = getSession();
    const originalExpiresAt = originalSession?.expiresAt;
    
    // Mock Date.now() to return a later timestamp
    const later = Date.now() + 60000; // 1 minute later
    vi.spyOn(Date, 'now').mockImplementation(() => later);
    
    // Extend the session
    const extendedSession = extendSession();
    
    expect(extendedSession).not.toBeNull();
    expect(extendedSession?.expiresAt).toBe(later + SESSION_TIMEOUT_MS);
    expect(extendedSession?.expiresAt).toBeGreaterThan(originalExpiresAt || 0);
  });
  
  it('should remove session', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Verify session exists
    expect(getSession()).not.toBeNull();
    
    // Remove session
    removeSession();
    
    // Verify session is removed
    expect(getSession()).toBeNull();
    expect(localStorage.getItem('sys_session')).toBeNull();
  });
  
  it('should check if session is valid', () => {
    // Initially no session
    expect(isSessionValid()).toBe(false);
    
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Now session should be valid
    expect(isSessionValid()).toBe(true);
    
    // Create an expired session
    const expiredSession = {
      userId,
      walletAddress,
      walletProvider,
      expiresAt: Date.now() - 1000 // Expired 1 second ago
    };
    
    localStorage.setItem('sys_session', JSON.stringify(expiredSession));
    
    // Session should be invalid
    expect(isSessionValid()).toBe(false);
  });
  
  it('should get time remaining in session', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Time remaining should be SESSION_TIMEOUT_MS
    expect(getSessionTimeRemaining()).toBe(SESSION_TIMEOUT_MS);
    
    // Mock Date.now() to return a later timestamp
    const later = Date.now() + 60000; // 1 minute later
    vi.spyOn(Date, 'now').mockImplementation(() => later);
    
    // Time remaining should be SESSION_TIMEOUT_MS - 60000
    expect(getSessionTimeRemaining()).toBe(SESSION_TIMEOUT_MS - 60000);
  });
  
  it('should format session time remaining', () => {
    // Create a session
    const userId = 'test-user';
    const walletAddress = 'test-wallet';
    const walletProvider = 'test-provider';
    
    createSession(userId, walletAddress, walletProvider);
    
    // Format time remaining
    const formatted = formatSessionTimeRemaining();
    
    // Should be in format "30m 0s" (for 30 minute default timeout)
    expect(formatted).toBe('30m 0s');
    
    // Mock Date.now() to return a later timestamp
    const later = Date.now() + 60000; // 1 minute later
    vi.spyOn(Date, 'now').mockImplementation(() => later);
    
    // Format time remaining
    const formattedLater = formatSessionTimeRemaining();
    
    // Should be in format "29m 0s"
    expect(formattedLater).toBe('29m 0s');
    
    // Create an expired session
    const expiredSession = {
      userId,
      walletAddress,
      walletProvider,
      expiresAt: Date.now() - 1000 // Expired 1 second ago
    };
    
    localStorage.setItem('sys_session', JSON.stringify(expiredSession));
    
    // Format time remaining for expired session
    const formattedExpired = formatSessionTimeRemaining();
    
    // Should be "Expired"
    expect(formattedExpired).toBe('Expired');
  });
});
