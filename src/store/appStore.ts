
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the store state types
interface AppState {
  // System state
  isDarkMode: boolean;
  isConnected: boolean;
  systemLatency: number | null;
  apiKeyConfigured: boolean;
  
  // Actions
  setDarkMode: (isDarkMode: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setSystemLatency: (latency: number | null) => void;
  setApiKeyConfigured: (isConfigured: boolean) => void;
}

/**
 * Global application state store
 * Uses zustand for state management with persistence to localStorage
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isDarkMode: true,
      isConnected: false,
      systemLatency: null,
      apiKeyConfigured: false,
      
      // Actions
      setDarkMode: (isDarkMode) => set({ isDarkMode }),
      setConnected: (isConnected) => set({ isConnected }),
      setSystemLatency: (latency) => set({ systemLatency: latency }),
      setApiKeyConfigured: (isConfigured) => set({ apiKeyConfigured: isConfigured }),
    }),
    {
      name: 'app-storage', // localStorage key
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        apiKeyConfigured: state.apiKeyConfigured
      }), // Only persist these values
    }
  )
);
