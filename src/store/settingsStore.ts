import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { errorHandler } from '@/utils/errorUtils';
import { getUserSettings, updateUserSettings } from '@/services/settingsService';
import APP_CONFIG from '@/config/appDefinition';

export interface SettingsState {
  // Theme settings
  darkMode: boolean;
  
  // Notification settings
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  
  // Trading settings
  autoTradeEnabled: boolean;
  riskLevel: number;
  
  // API settings
  apiKey: string;
  heliusApiKey: string;
  
  // System status
  systemActive: boolean;
  systemLatency: number | null;
  
  // Currency
  currency: string;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleAutoTrade: () => void;
  setRiskLevel: (level: number) => void;
  setCurrency: (currency: string) => void;
  setApiKey: (key: string) => void;
  setHeliusApiKey: (key: string) => void;
  setSystemStatus: (active: boolean, latency: number | null) => void;
  loadSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string) => Promise<void>;
  resetSettings: () => void;
  clearErrors: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state with defaults from APP_CONFIG
        darkMode: true,
        notificationsEnabled: true,
        soundEnabled: true,
        autoTradeEnabled: false,
        riskLevel: 50,
        apiKey: '',
        heliusApiKey: APP_CONFIG.api.defaultApiKey,
        systemActive: true,
        systemLatency: null,
        currency: APP_CONFIG.defaultCurrency,
        isLoading: false,
        error: null,
        
        // Toggle dark mode
        toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
        
        // Toggle notifications
        toggleNotifications: () => set(state => ({ notificationsEnabled: !state.notificationsEnabled })),
        
        // Toggle sound
        toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
        
        // Toggle auto trade
        toggleAutoTrade: () => set(state => ({ autoTradeEnabled: !state.autoTradeEnabled })),
        
        // Set risk level
        setRiskLevel: (level: number) => set({ riskLevel: level }),
        
        // Set currency
        setCurrency: (currency: string) => set({ currency }),
        
        // Set API key
        setApiKey: (key: string) => set({ apiKey: key }),
        
        // Set Helius API key
        setHeliusApiKey: (key: string) => set({ heliusApiKey: key }),
        
        // Set system status
        setSystemStatus: (active: boolean, latency: number | null) => set({ 
          systemActive: active, 
          systemLatency: latency 
        }),
        
        // Load settings from API
        loadSettings: async (userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const settings = await getUserSettings(userId);
            
            if (settings) {
              set({
                notificationsEnabled: settings.notifications_enabled,
                soundEnabled: settings.sound_enabled,
                autoTradeEnabled: settings.auto_trade_enabled,
                darkMode: settings.dark_mode,
                riskLevel: settings.risk_level,
                currency: settings.currency,
                systemActive: settings.system_active,
                systemLatency: settings.system_latency,
                apiKey: settings.api_key || '',
                heliusApiKey: settings.helius_api_key || APP_CONFIG.api.defaultApiKey
              });
            }
          } catch (error) {
            console.error('Error loading settings:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error loading settings'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error loading settings'),
              'loadSettings'
            );
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Save settings to API
        saveSettings: async (userId: string) => {
          set({ isLoading: true, error: null });
          try {
            const state = get();
            
            await updateUserSettings(userId, {
              notifications_enabled: state.notificationsEnabled,
              sound_enabled: state.soundEnabled,
              auto_trade_enabled: state.autoTradeEnabled,
              dark_mode: state.darkMode,
              risk_level: state.riskLevel,
              currency: state.currency,
              system_active: state.systemActive,
              system_latency: state.systemLatency,
              api_key: state.apiKey,
              helius_api_key: state.heliusApiKey
            });
          } catch (error) {
            console.error('Error saving settings:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error saving settings'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error saving settings'),
              'saveSettings'
            );
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Reset settings to defaults
        resetSettings: () => set({
          darkMode: true,
          notificationsEnabled: true,
          soundEnabled: true,
          autoTradeEnabled: false,
          riskLevel: 50,
          currency: APP_CONFIG.defaultCurrency,
          systemActive: true,
          systemLatency: null,
          error: null
        }),
        
        // Clear errors
        clearErrors: () => set({ error: null })
      }),
      {
        name: 'settings-storage',
        partialize: (state) => ({
          darkMode: state.darkMode,
          notificationsEnabled: state.notificationsEnabled,
          soundEnabled: state.soundEnabled,
          autoTradeEnabled: state.autoTradeEnabled,
          riskLevel: state.riskLevel,
          currency: state.currency,
          heliusApiKey: state.heliusApiKey
        }),
      }
    )
  )
);
