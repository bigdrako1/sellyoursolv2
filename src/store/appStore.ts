
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the store state types
interface AppState {
  // System state
  isDarkMode: boolean;
  isConnected: boolean;
  systemLatency: number | null;
  apiKeyConfigured: boolean;
  isLoading: boolean;
  lastError: string | null;
  
  // Actions
  setDarkMode: (isDarkMode: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  setSystemLatency: (latency: number | null) => void;
  setApiKeyConfigured: (isConfigured: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
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
      isLoading: false,
      lastError: null,
      
      // Actions
      setDarkMode: (isDarkMode) => set({ isDarkMode }),
      setConnected: (isConnected) => set({ isConnected }),
      setSystemLatency: (latency) => set({ systemLatency: latency }),
      setApiKeyConfigured: (isConfigured) => set({ apiKeyConfigured: isConfigured }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ lastError: error }),
      clearError: () => set({ lastError: null }),
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
