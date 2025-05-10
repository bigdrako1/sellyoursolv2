import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface TradingPreferences {
  // Basic trading preferences
  defaultTradeAmount: number;
  maxPositions: number;
  
  // Risk management
  stopLossPercentage: number;
  useTrailingStopLoss: boolean;
  trailingStopLossDistance: number;
  
  // Scale out strategy
  scaleOutEnabled: boolean;
  scaleOutLevels: {
    multiplier: number;
    percentage: number;
  }[];
  
  // Auto trading
  autoTradeEnabled: boolean;
  autoTradeStrategies: {
    id: string;
    name: string;
    enabled: boolean;
  }[];
  
  // Notifications
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  notifyOnStopLoss: boolean;
  notifyOnScaleOut: boolean;
  
  // Display preferences
  showPnLCard: boolean;
  sharePnLOnExit: boolean;
  pnLCardTemplate: string;
}

export interface UserPreferencesState {
  // User preferences
  tradingPreferences: TradingPreferences;
  
  // Actions
  updateTradingPreferences: (preferences: Partial<TradingPreferences>) => void;
  resetTradingPreferences: () => void;
}

// Default trading preferences
const DEFAULT_TRADING_PREFERENCES: TradingPreferences = {
  // Basic trading preferences
  defaultTradeAmount: 0.1, // SOL
  maxPositions: 5,
  
  // Risk management
  stopLossPercentage: 10, // 10%
  useTrailingStopLoss: true,
  trailingStopLossDistance: 15, // 15%
  
  // Scale out strategy
  scaleOutEnabled: true,
  scaleOutLevels: [
    { multiplier: 2, percentage: 50 }, // At 2x, sell 50%
    { multiplier: 3, percentage: 25 }, // At 3x, sell 25%
    { multiplier: 4, percentage: 15 }, // At 4x, sell 15%
    { multiplier: 5, percentage: 10 }  // At 5x, sell remaining 10%
  ],
  
  // Auto trading
  autoTradeEnabled: false,
  autoTradeStrategies: [
    { id: 'smart-money', name: 'Smart Money Tracking', enabled: true },
    { id: 'whale-activity', name: 'Whale Activity', enabled: true },
    { id: 'quality-tokens', name: 'Quality Tokens', enabled: true }
  ],
  
  // Notifications
  notifyOnEntry: true,
  notifyOnExit: true,
  notifyOnStopLoss: true,
  notifyOnScaleOut: true,
  
  // Display preferences
  showPnLCard: true,
  sharePnLOnExit: true,
  pnLCardTemplate: 'default'
};

export const useUserPreferencesStore = create<UserPreferencesState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        tradingPreferences: DEFAULT_TRADING_PREFERENCES,
        
        // Update trading preferences
        updateTradingPreferences: (preferences: Partial<TradingPreferences>) => 
          set((state) => ({
            tradingPreferences: {
              ...state.tradingPreferences,
              ...preferences
            }
          })),
        
        // Reset trading preferences to defaults
        resetTradingPreferences: () => 
          set({ tradingPreferences: DEFAULT_TRADING_PREFERENCES })
      }),
      {
        name: 'user-preferences-storage',
      }
    )
  )
);
