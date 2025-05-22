
import { toast } from "sonner";

// Types for Telegram authentication
export interface TelegramUserSession {
  userId?: string;
  phone?: string;
  isAuthenticated: boolean;
  sessionKey?: string;
  lastActive?: string;
}

// Simulated session storage keys
const TELEGRAM_SESSION_KEY = 'telegram_user_session';
const TELEGRAM_CHANNELS_KEY = 'telegram_channels';

/**
 * Store Telegram user session in localStorage
 */
export const storeTelegramSession = (sessionData: TelegramUserSession): void => {
  try {
    localStorage.setItem(TELEGRAM_SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to store Telegram session:', error);
  }
};

/**
 * Retrieve Telegram user session from localStorage
 */
export const getTelegramSession = (): TelegramUserSession | null => {
  try {
    const sessionData = localStorage.getItem(TELEGRAM_SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve Telegram session:', error);
    return null;
  }
};

/**
 * Clear Telegram user session from localStorage
 */
export const clearTelegramSession = (): void => {
  try {
    localStorage.removeItem(TELEGRAM_SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear Telegram session:', error);
  }
};

/**
 * Telegram user authentication with improved error handling and logging
 */
export const authenticateTelegramUser = async (phone: string, code?: string): Promise<TelegramUserSession> => {
  // In a real implementation, this would connect to the Telegram API
  // using a library like Telethon or GramJS

  console.log(`Telegram auth attempt: ${phone ? 'Phone provided' : 'No phone'}, ${code ? 'Code provided' : 'No code'}`);

  // For demo purposes, we'll simulate the authentication process with better error handling
  return new Promise((resolve, reject) => {
    // Validate phone number format
    if (!phone) {
      const error = new Error('Phone number is required');
      console.error('Telegram auth error:', error);
      reject(error);
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      const error = new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
      console.error('Telegram auth error:', error);
      reject(error);
      return;
    }

    setTimeout(() => {
      try {
        if (!code && phone) {
          // First step: Simulate sending code to phone
          console.log(`Sending verification code to ${phone}`);

          // Always use code "12345" for demo purposes
          const demoCode = "12345";
          console.log(`Demo code for testing: ${demoCode}`);

          toast.success("Verification code sent", {
            description: `A code has been sent to ${phone}. For demo purposes, use code: ${demoCode}`
          });

          resolve({
            phone,
            isAuthenticated: false
          });
          return;
        }

        if (code) {
          // Second step: Verify code
          console.log(`Verifying code: ${code} for phone: ${phone}`);

          // In a real implementation, this would validate the code with Telegram
          if (code.length < 5) {
            const error = new Error('Invalid verification code. Code must be at least 5 characters.');
            console.error('Telegram auth error:', error);
            reject(error);
            return;
          }

          // For demo purposes, accept any 5-digit code or "12345"
          const isValidCode = code.length === 5 || code === "12345";

          if (!isValidCode) {
            const error = new Error('Invalid verification code. Please try again.');
            console.error('Telegram auth error:', error);
            reject(error);
            return;
          }

          const sessionData: TelegramUserSession = {
            userId: `user_${Math.floor(Math.random() * 10000000)}`,
            phone,
            isAuthenticated: true,
            sessionKey: `session_${Date.now()}`,
            lastActive: new Date().toISOString()
          };

          // Store the session
          storeTelegramSession(sessionData);
          console.log('Telegram session stored successfully:', sessionData);

          toast.success("Authentication successful", {
            description: "Successfully connected to Telegram"
          });

          resolve(sessionData);
        } else {
          const error = new Error('Verification code is required');
          console.error('Telegram auth error:', error);
          reject(error);
        }
      } catch (error) {
        console.error('Unexpected error during Telegram authentication:', error);
        reject(new Error('An unexpected error occurred during authentication. Please try again.'));
      }
    }, 1500);
  });
};

/**
 * Sign out from Telegram
 */
export const signOutFromTelegram = (): void => {
  clearTelegramSession();
  toast.info("Signed out from Telegram", {
    description: "Your Telegram session has been ended"
  });
};

/**
 * Check if user is authenticated with Telegram
 */
export const isAuthenticatedWithTelegram = (): boolean => {
  const session = getTelegramSession();
  return !!session?.isAuthenticated;
};
