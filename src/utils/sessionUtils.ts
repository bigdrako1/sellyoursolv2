/**
 * Session management utilities
 * Provides secure methods for handling user sessions
 */

// Session timeout in milliseconds (30 minutes)
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Session storage key
const SESSION_KEY = 'sys_session';

// Session data interface
export interface SessionData {
  userId: string;
  walletAddress: string | null;
  walletProvider: string | null;
  expiresAt: number;
  refreshToken?: string;
}

/**
 * Create a new session
 */
export const createSession = (
  userId: string,
  walletAddress: string | null,
  walletProvider: string | null,
  expiresInMs: number = SESSION_TIMEOUT_MS
): SessionData => {
  const session: SessionData = {
    userId,
    walletAddress,
    walletProvider,
    expiresAt: Date.now() + expiresInMs,
  };
  
  // Store session in localStorage with encryption in a real app
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  return session;
};

/**
 * Get current session
 */
export const getSession = (): SessionData | null => {
  const sessionData = localStorage.getItem(SESSION_KEY);
  
  if (!sessionData) {
    return null;
  }
  
  try {
    const session: SessionData = JSON.parse(sessionData);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Session expired, remove it
      removeSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing session data:', error);
    removeSession();
    return null;
  }
};

/**
 * Extend session expiration
 */
export const extendSession = (expiresInMs: number = SESSION_TIMEOUT_MS): SessionData | null => {
  const session = getSession();
  
  if (!session) {
    return null;
  }
  
  // Update expiration time
  session.expiresAt = Date.now() + expiresInMs;
  
  // Save updated session
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  return session;
};

/**
 * Remove session
 */
export const removeSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

/**
 * Check if session is valid
 */
export const isSessionValid = (): boolean => {
  return getSession() !== null;
};

/**
 * Get time remaining in session (in milliseconds)
 */
export const getSessionTimeRemaining = (): number => {
  const session = getSession();
  
  if (!session) {
    return 0;
  }
  
  return Math.max(0, session.expiresAt - Date.now());
};

/**
 * Format session time remaining in human-readable format
 */
export const formatSessionTimeRemaining = (): string => {
  const timeRemaining = getSessionTimeRemaining();
  
  if (timeRemaining <= 0) {
    return 'Expired';
  }
  
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  
  return `${minutes}m ${seconds}s`;
};
