import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { getWalletBalances, getWalletTransactions } from '@/utils/walletUtils';
import { errorHandler } from '@/utils/errorUtils';

export interface WalletBalance {
  symbol: string;
  name: string;
  mint: string;
  amount: number;
  decimals: number;
  usdValue: number;
  logo?: string;
}

export interface WalletData {
  address: string;
  balance: number; // SOL balance
  tokens: WalletBalance[];
  totalUsdValue: number;
}

export interface WalletTransaction {
  signature: string;
  timestamp: number;
  slot: number;
  success: boolean;
  fee: number;
  type: string;
  tokenTransfers?: {
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }[];
}

interface WalletState {
  // Wallet data
  walletData: WalletData | null;
  trackedWallets: string[];
  transactions: WalletTransaction[];
  
  // Loading states
  isLoading: boolean;
  isTransactionsLoading: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  fetchWalletData: (address: string) => Promise<void>;
  fetchWalletTransactions: (address: string) => Promise<void>;
  addTrackedWallet: (address: string) => void;
  removeTrackedWallet: (address: string) => void;
  clearErrors: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        walletData: null,
        trackedWallets: [],
        transactions: [],
        isLoading: false,
        isTransactionsLoading: false,
        error: null,
        
        // Fetch wallet data
        fetchWalletData: async (address: string) => {
          set({ isLoading: true, error: null });
          try {
            const data = await getWalletBalances(address);
            set({ walletData: data });
          } catch (error) {
            console.error('Error fetching wallet data:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error fetching wallet data'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error fetching wallet data'),
              'fetchWalletData'
            );
          } finally {
            set({ isLoading: false });
          }
        },
        
        // Fetch wallet transactions
        fetchWalletTransactions: async (address: string) => {
          set({ isTransactionsLoading: true, error: null });
          try {
            const txs = await getWalletTransactions(address);
            set({ transactions: txs });
          } catch (error) {
            console.error('Error fetching wallet transactions:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error fetching wallet transactions'
            });
            errorHandler.handleError(
              error instanceof Error ? error : new Error('Unknown error fetching wallet transactions'),
              'fetchWalletTransactions'
            );
          } finally {
            set({ isTransactionsLoading: false });
          }
        },
        
        // Add wallet to tracked wallets
        addTrackedWallet: (address: string) => {
          const { trackedWallets } = get();
          // Check if wallet is already tracked
          if (!trackedWallets.includes(address)) {
            set({ trackedWallets: [...trackedWallets, address] });
          }
        },
        
        // Remove wallet from tracked wallets
        removeTrackedWallet: (address: string) => {
          const { trackedWallets } = get();
          set({ 
            trackedWallets: trackedWallets.filter(wallet => wallet !== address)
          });
        },
        
        // Clear errors
        clearErrors: () => set({ error: null })
      }),
      {
        name: 'wallet-storage',
        partialize: (state) => ({ 
          trackedWallets: state.trackedWallets 
        }),
      }
    )
  )
);
