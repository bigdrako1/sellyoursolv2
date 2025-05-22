import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authenticateTelegramUser,
  storeTelegramSession,
  getTelegramSession,
  clearTelegramSession
} from './telegramAuthService';

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
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock console methods
console.log = vi.fn();
console.error = vi.fn();

describe('telegramAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('authenticateTelegramUser', () => {
    it('rejects if phone number is not provided', async () => {
      await expect(authenticateTelegramUser('')).rejects.toThrow('Phone number is required');
      expect(console.error).toHaveBeenCalled();
    });

    it('rejects if phone number format is invalid', async () => {
      await expect(authenticateTelegramUser('invalid')).rejects.toThrow('Invalid phone number format');
      expect(console.error).toHaveBeenCalled();
    });

    it('sends verification code when valid phone number is provided', async () => {
      const promise = authenticateTelegramUser('+12345678900');

      // Fast-forward timers to resolve the promise
      vi.advanceTimersByTime(2000);

      const result = await promise;

      expect(result).toEqual({
        phone: '+12345678900',
        isAuthenticated: false,
      });
      expect(console.log).toHaveBeenCalledWith('Sending verification code to +12345678900');
    });

    it('rejects if verification code is too short', async () => {
      const promise = authenticateTelegramUser('+12345678900', '123');

      // Fast-forward timers to resolve the promise
      vi.advanceTimersByTime(2000);

      await expect(promise).rejects.toThrow('Invalid verification code');
      expect(console.error).toHaveBeenCalled();
    }, 10000);

    it('authenticates user when valid verification code is provided', async () => {
      const promise = authenticateTelegramUser('+12345678900', '12345');

      // Fast-forward timers to resolve the promise
      vi.advanceTimersByTime(2000);

      const result = await promise;

      expect(result.isAuthenticated).toBe(true);
      expect(result.phone).toBe('+12345678900');
      expect(result.userId).toBeDefined();
      expect(result.sessionKey).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('storeTelegramSession', () => {
    it('stores session data in localStorage', () => {
      const sessionData = {
        userId: 'user_123',
        phone: '+12345678900',
        isAuthenticated: true,
        sessionKey: 'session_123',
        lastActive: new Date().toISOString(),
      };

      storeTelegramSession(sessionData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'telegram_user_session',
        JSON.stringify(sessionData)
      );
    });
  });

  describe('getTelegramSession', () => {
    it('returns null if no session exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getTelegramSession();

      expect(result).toBeNull();
    });

    it('returns session data if it exists', () => {
      const sessionData = {
        userId: 'user_123',
        phone: '+12345678900',
        isAuthenticated: true,
        sessionKey: 'session_123',
        lastActive: new Date().toISOString(),
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(sessionData));

      const result = getTelegramSession();

      expect(result).toEqual(sessionData);
    });
  });

  describe('clearTelegramSession', () => {
    it('removes session data from localStorage', () => {
      clearTelegramSession();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('telegram_user_session');
    });
  });
});
