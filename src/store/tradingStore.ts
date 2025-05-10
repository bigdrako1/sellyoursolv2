import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TradingPosition } from '@/types/token.types';
import { 
  loadTradingPositions, 
  saveTradingPositions, 
  updateTradingPosition,
  createTradingPosition as createPosition
} from '@/utils/tradingUtils';
import { errorHandler } from '@/utils/errorUtils';

interface TradingState {
  // Trading positions
  positions: TradingPosition[];
  activePositions: TradingPosition[];
  closedPositions: TradingPosition[];
  
  // Trading settings
  autoSecureInitial: boolean;
  defaultSlippage: number;
  
  // Loading states
  isLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  loadPositions: () => void;
  createTradingPosition: (
    contractAddress: string,
    tokenName: string,
    tokenSymbol: string,
    entryPrice: number,
    initialInvestment: number,
    source: string
  ) => TradingPosition;
  updatePosition: (position: TradingPosition, currentPrice: number) => TradingPosition;
  closePosition: (positionId: string, exitPrice: number) => void;
  setAutoSecureInitial: (value: boolean) => void;
  setDefaultSlippage: (value: number) => void;
  clearErrors: () => void;
}

export const useTradingStore = create<TradingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        positions: [],
        activePositions: [],
        closedPositions: [],
        autoSecureInitial: true,
        defaultSlippage: 0.5,
        isLoading: false,
        error: null,
        
        // Load trading positions
        loadPositions: () => {
          try {
            const positions = loadTradingPositions();
            const activePositions = positions.filter(p => p.status === 'active');
            const closedPositions = positions.filter(p => p.status === 'closed');
            
            set({ 
              positions,
              activePositions,
              closedPositions
            });
          } catch (error) {
            console.error('Error loading trading positions:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error loading trading positions'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error loading trading positions'),
              'loadPositions'
            );
          }
        },
        
        // Create a new trading position
        createTradingPosition: (
          contractAddress: string,
          tokenName: string,
          tokenSymbol: string,
          entryPrice: number,
          initialInvestment: number,
          source: string
        ) => {
          try {
            // Create new position
            const newPosition = createPosition(
              contractAddress,
              tokenName,
              tokenSymbol,
              entryPrice,
              initialInvestment,
              source
            );
            
            // Update state
            const { positions, activePositions } = get();
            const updatedPositions = [...positions, newPosition];
            const updatedActivePositions = [...activePositions, newPosition];
            
            // Save to localStorage
            saveTradingPositions(updatedPositions);
            
            // Update state
            set({ 
              positions: updatedPositions,
              activePositions: updatedActivePositions
            });
            
            return newPosition;
          } catch (error) {
            console.error('Error creating trading position:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error creating trading position'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error creating trading position'),
              'createTradingPosition'
            );
            throw error;
          }
        },
        
        // Update a trading position
        updatePosition: (position: TradingPosition, currentPrice: number) => {
          try {
            // Update position
            const updatedPosition = updateTradingPosition(position, currentPrice);
            
            // Update state
            const { positions, activePositions } = get();
            const updatedPositions = positions.map(p => 
              p.contractAddress === position.contractAddress ? updatedPosition : p
            );
            const updatedActivePositions = activePositions.map(p => 
              p.contractAddress === position.contractAddress ? updatedPosition : p
            );
            
            // Save to localStorage
            saveTradingPositions(updatedPositions);
            
            // Update state
            set({ 
              positions: updatedPositions,
              activePositions: updatedActivePositions
            });
            
            return updatedPosition;
          } catch (error) {
            console.error('Error updating trading position:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error updating trading position'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error updating trading position'),
              'updatePosition'
            );
            return position;
          }
        },
        
        // Close a trading position
        closePosition: (positionId: string, exitPrice: number) => {
          try {
            const { positions, activePositions, closedPositions } = get();
            
            // Find position
            const position = positions.find(p => p.contractAddress === positionId);
            
            if (!position) {
              throw new Error(`Position with ID ${positionId} not found`);
            }
            
            // Update position
            const updatedPosition = {
              ...position,
              status: 'closed' as const,
              exitPrice,
              exitTime: new Date().toISOString(),
              pnl: (exitPrice - position.entryPrice) * position.initialInvestment / position.entryPrice,
              roi: ((exitPrice - position.entryPrice) / position.entryPrice) * 100
            };
            
            // Update state
            const updatedPositions = positions.map(p => 
              p.contractAddress === positionId ? updatedPosition : p
            );
            const updatedActivePositions = activePositions.filter(p => 
              p.contractAddress !== positionId
            );
            const updatedClosedPositions = [...closedPositions, updatedPosition];
            
            // Save to localStorage
            saveTradingPositions(updatedPositions);
            
            // Update state
            set({ 
              positions: updatedPositions,
              activePositions: updatedActivePositions,
              closedPositions: updatedClosedPositions
            });
          } catch (error) {
            console.error('Error closing trading position:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error closing trading position'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error closing trading position'),
              'closePosition'
            );
          }
        },
        
        // Set auto secure initial
        setAutoSecureInitial: (value: boolean) => {
          set({ autoSecureInitial: value });
        },
        
        // Set default slippage
        setDefaultSlippage: (value: number) => {
          set({ defaultSlippage: value });
        },
        
        // Clear errors
        clearErrors: () => set({ error: null })
      }),
      {
        name: 'trading-storage',
        partialize: (state) => ({ 
          positions: state.positions,
          autoSecureInitial: state.autoSecureInitial,
          defaultSlippage: state.defaultSlippage
        }),
      }
    )
  )
);
