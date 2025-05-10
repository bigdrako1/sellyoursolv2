import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Token } from '@/types/token.types';
import { getRecentTokenActivity, getTrendingTokens, getPumpFunTokens, tokenInfoToToken } from '@/services/tokenDataService';
import { errorHandler } from '@/utils/errorUtils';

interface TokenState {
  // Token lists
  tokens: Token[];
  trendingTokens: Token[];
  pumpFunTokens: Token[];
  watchlist: Token[];
  
  // Loading states
  isLoading: boolean;
  isTrendingLoading: boolean;
  isPumpFunLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchTokens: () => Promise<void>;
  fetchTrendingTokens: () => Promise<void>;
  fetchPumpFunTokens: () => Promise<void>;
  addToWatchlist: (token: Token) => void;
  removeFromWatchlist: (tokenAddress: string) => void;
  clearErrors: () => void;
}

export const useTokenStore = create<TokenState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tokens: [],
        trendingTokens: [],
        pumpFunTokens: [],
        watchlist: [],
        isLoading: false,
        isTrendingLoading: false,
        isPumpFunLoading: false,
        error: null,
        
        // Fetch recent token activity
        fetchTokens: async () => {
          set({ isLoading: true, error: null });
          try {
            const tokenActivity = await getRecentTokenActivity();
            
            if (tokenActivity && Array.isArray(tokenActivity)) {
              // Process token data
              const tokenData: Token[] = tokenActivity.map(token => tokenInfoToToken(token));
              set({ tokens: tokenData });
            } else {
              throw new Error('No token data returned from API');
            }
          } catch (error) {
            console.error('Error fetching tokens:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error fetching tokens'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error fetching tokens'),
              'fetchTokens'
            );
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Fetch trending tokens
        fetchTrendingTokens: async () => {
          set({ isTrendingLoading: true, error: null });
          try {
            const trending = await getTrendingTokens();
            
            if (trending && Array.isArray(trending)) {
              // Convert TokenInfo to Token
              const trendingTokenData = trending.map(token => tokenInfoToToken(token));
              set({ trendingTokens: trendingTokenData });
            } else {
              throw new Error('No trending token data returned from API');
            }
          } catch (error) {
            console.error('Error fetching trending tokens:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error fetching trending tokens'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error fetching trending tokens'),
              'fetchTrendingTokens'
            );
          } finally {
            set({ isTrendingLoading: false });
          }
        },
        
        // Fetch pump.fun tokens
        fetchPumpFunTokens: async () => {
          set({ isPumpFunLoading: true, error: null });
          try {
            const pumpTokens = await getPumpFunTokens();
            
            if (pumpTokens && Array.isArray(pumpTokens)) {
              // Convert TokenInfo to Token
              const pumpTokenData = pumpTokens.map(token => tokenInfoToToken(token));
              set({ pumpFunTokens: pumpTokenData });
            } else {
              throw new Error('No pump.fun token data returned from API');
            }
          } catch (error) {
            console.error('Error fetching pump.fun tokens:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error fetching pump.fun tokens'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error fetching pump.fun tokens'),
              'fetchPumpFunTokens'
            );
          } finally {
            set({ isPumpFunLoading: false });
          }
        },
        
        // Add token to watchlist
        addToWatchlist: (token: Token) => {
          const { watchlist } = get();
          // Check if token is already in watchlist
          if (!watchlist.some(t => t.address === token.address)) {
            set({ watchlist: [...watchlist, token] });
          }
        },
        
        // Remove token from watchlist
        removeFromWatchlist: (tokenAddress: string) => {
          const { watchlist } = get();
          set({ 
            watchlist: watchlist.filter(token => token.address !== tokenAddress)
          });
        },
        
        // Clear errors
        clearErrors: () => set({ error: null })
      }),
      {
        name: 'token-storage',
        partialize: (state) => ({ 
          watchlist: state.watchlist 
        }),
      }
    )
  )
);
