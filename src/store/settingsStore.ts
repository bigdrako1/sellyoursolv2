
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemSettings {
  systemActive: boolean;
  monitoringEnabled: boolean;
  autoTradeEnabled: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  maximumInvestment: number;
  riskLevel: number;
  minimumLiquidity: number;
  minimumVolume: number;
  minimumHolders: number;
  maximumRiskScore: number;
}

interface SettingsState {
  // System settings
  systemSettings: SystemSettings;
  
  // UI state
  activeSettingsTab: string;
  activeSystemControlTab: string;
  
  // Actions
  setSystemActive: (isActive: boolean) => void;
  setMonitoringEnabled: (isEnabled: boolean) => void;
  setAutoTradeEnabled: (isEnabled: boolean) => void;
  setNotificationsEnabled: (isEnabled: boolean) => void;
  setSoundEnabled: (isEnabled: boolean) => void;
  setMaximumInvestment: (value: number) => void;
  setRiskLevel: (value: number) => void;
  setMinimumLiquidity: (value: number) => void;
  setMinimumVolume: (value: number) => void;
  setMinimumHolders: (value: number) => void;
  setMaximumRiskScore: (value: number) => void;
  
  setActiveSettingsTab: (tab: string) => void;
  setActiveSystemControlTab: (tab: string) => void;
  resetSettings: () => void;
}

const defaultSystemSettings: SystemSettings = {
  systemActive: true,
  monitoringEnabled: true,
  autoTradeEnabled: false,
  notificationsEnabled: true,
  soundEnabled: true,
  maximumInvestment: 25,
  riskLevel: 50,
  minimumLiquidity: 10000,
  minimumVolume: 5000,
  minimumHolders: 50,
  maximumRiskScore: 70,
};

/**
 * Global settings state store
 * Uses zustand for state management with persistence to localStorage
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      systemSettings: defaultSystemSettings,
      activeSettingsTab: "general",
      activeSystemControlTab: "dashboard",
      
      // Actions
      setSystemActive: (isActive) => set(state => ({ 
        systemSettings: { ...state.systemSettings, systemActive: isActive } 
      })),
      
      setMonitoringEnabled: (isEnabled) => set(state => ({ 
        systemSettings: { ...state.systemSettings, monitoringEnabled: isEnabled } 
      })),
      
      setAutoTradeEnabled: (isEnabled) => set(state => ({ 
        systemSettings: { ...state.systemSettings, autoTradeEnabled: isEnabled } 
      })),
      
      setNotificationsEnabled: (isEnabled) => set(state => ({ 
        systemSettings: { ...state.systemSettings, notificationsEnabled: isEnabled } 
      })),
      
      setSoundEnabled: (isEnabled) => set(state => ({ 
        systemSettings: { ...state.systemSettings, soundEnabled: isEnabled } 
      })),
      
      setMaximumInvestment: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, maximumInvestment: value } 
      })),
      
      setRiskLevel: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, riskLevel: value } 
      })),
      
      setMinimumLiquidity: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, minimumLiquidity: value } 
      })),
      
      setMinimumVolume: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, minimumVolume: value } 
      })),
      
      setMinimumHolders: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, minimumHolders: value } 
      })),
      
      setMaximumRiskScore: (value) => set(state => ({ 
        systemSettings: { ...state.systemSettings, maximumRiskScore: value } 
      })),
      
      setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
      setActiveSystemControlTab: (tab) => set({ activeSystemControlTab: tab }),
      
      resetSettings: () => set({ systemSettings: defaultSystemSettings }),
    }),
    {
      name: 'settings-store', // localStorage key
    }
  )
);
