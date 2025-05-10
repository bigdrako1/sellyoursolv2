
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
  
  // Token detection settings
  qualityThreshold: number;
  trendingTokenWeight: number;
  smartMoneyWeight: number;
  
  // Wallet tracking settings
  autoTrackProfitableWallets: boolean;
  walletTrackingThreshold: number;
}

interface UIState {
  activeSettingsTab: string;
  activeSystemControlTab: string;
  timeRange: "24h" | "7d" | "30d" | "all";
}

interface SettingsState {
  // System settings
  systemSettings: SystemSettings;
  
  // UI state
  uiState: UIState;
  
  // Actions - System settings
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
  setQualityThreshold: (value: number) => void;
  setTrendingTokenWeight: (value: number) => void;
  setSmartMoneyWeight: (value: number) => void;
  setAutoTrackProfitableWallets: (isEnabled: boolean) => void;
  setWalletTrackingThreshold: (value: number) => void;
  
  // Actions - UI state
  setActiveSettingsTab: (tab: string) => void;
  setActiveSystemControlTab: (tab: string) => void;
  setTimeRange: (range: "24h" | "7d" | "30d" | "all") => void;
  
  // Bulk actions
  resetSettings: () => void;
  
  // Convenience methods
  getSetting: <K extends keyof SystemSettings>(key: K) => SystemSettings[K];
  getUIState: <K extends keyof UIState>(key: K) => UIState[K];
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
  qualityThreshold: 70,
  trendingTokenWeight: 20,
  smartMoneyWeight: 30,
  autoTrackProfitableWallets: false,
  walletTrackingThreshold: 100,
};

const defaultUIState: UIState = {
  activeSettingsTab: "general",
  activeSystemControlTab: "dashboard",
  timeRange: "7d",
};

/**
 * Global settings state store
 * Uses zustand for state management with persistence to localStorage
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      systemSettings: defaultSystemSettings,
      uiState: defaultUIState,
      
      // Actions - System settings
      setSystemActive: (isActive) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, systemActive: isActive } 
      })),
      
      setMonitoringEnabled: (isEnabled) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, monitoringEnabled: isEnabled } 
      })),
      
      setAutoTradeEnabled: (isEnabled) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, autoTradeEnabled: isEnabled } 
      })),
      
      setNotificationsEnabled: (isEnabled) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, notificationsEnabled: isEnabled } 
      })),
      
      setSoundEnabled: (isEnabled) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, soundEnabled: isEnabled } 
      })),
      
      setMaximumInvestment: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, maximumInvestment: value } 
      })),
      
      setRiskLevel: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, riskLevel: value } 
      })),
      
      setMinimumLiquidity: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, minimumLiquidity: value } 
      })),
      
      setMinimumVolume: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, minimumVolume: value } 
      })),
      
      setMinimumHolders: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, minimumHolders: value } 
      })),
      
      setMaximumRiskScore: (value) => set((state) => ({ 
        systemSettings: { ...state.systemSettings, maximumRiskScore: value } 
      })),
      
      setQualityThreshold: (value) => set((state) => ({
        systemSettings: { ...state.systemSettings, qualityThreshold: value }
      })),
      
      setTrendingTokenWeight: (value) => set((state) => ({
        systemSettings: { ...state.systemSettings, trendingTokenWeight: value }
      })),
      
      setSmartMoneyWeight: (value) => set((state) => ({
        systemSettings: { ...state.systemSettings, smartMoneyWeight: value }
      })),
      
      setAutoTrackProfitableWallets: (isEnabled) => set((state) => ({
        systemSettings: { ...state.systemSettings, autoTrackProfitableWallets: isEnabled }
      })),
      
      setWalletTrackingThreshold: (value) => set((state) => ({
        systemSettings: { ...state.systemSettings, walletTrackingThreshold: value }
      })),
      
      // Actions - UI state
      setActiveSettingsTab: (tab) => set((state) => ({ 
        uiState: { ...state.uiState, activeSettingsTab: tab }
      })),
      
      setActiveSystemControlTab: (tab) => set((state) => ({ 
        uiState: { ...state.uiState, activeSystemControlTab: tab }
      })),
      
      setTimeRange: (range) => set((state) => ({
        uiState: { ...state.uiState, timeRange: range }
      })),
      
      // Bulk actions
      resetSettings: () => set({
        systemSettings: defaultSystemSettings,
        uiState: defaultUIState,
      }),
      
      // Convenience methods
      getSetting: (key) => get().systemSettings[key],
      getUIState: (key) => get().uiState[key],
    }),
    {
      name: 'settings-store', // localStorage key
    }
  )
);
