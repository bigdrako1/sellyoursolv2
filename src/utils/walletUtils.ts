
// Wallet connection and management utilities
import { toast } from "@/components/ui/use-toast";

export interface WalletData {
  address: string;
  balance: number;
  tokens: TokenData[];
  totalUsdValue: number;
}

export interface TokenData {
  symbol: string;
  balance: number;
  usdValue: number;
  price?: number;
  change24h?: number;
  logo?: string;
}

/**
 * Connects to a wallet provider
 * @param provider Wallet provider name
 * @returns Connection result with wallet address
 */
export const connectWallet = async (provider: string): Promise<any> => {
  try {
    // This is a mock implementation - in a real app, this would connect to actual wallet providers
    const address = `${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;

    // Store the wallet in localStorage for persistence
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletProvider', provider);

    return {
      success: true,
      address,
      provider
    };
  } catch (error) {
    console.error("Error connecting wallet:", error);
    return {
      success: false,
      error: "Failed to connect wallet"
    };
  }
};

/**
 * Disconnects the currently connected wallet
 * @returns Success status
 */
export const disconnectWallet = async (): Promise<boolean> => {
  try {
    // Clear the wallet from localStorage
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletProvider');

    return true;
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    return false;
  }
};

/**
 * Checks if a wallet is currently connected
 * @returns Connected wallet address or null
 */
export const getConnectedWallet = (): string | null => {
  return localStorage.getItem('walletAddress');
};

/**
 * Fetches wallet balance information
 * @param address Wallet address
 * @returns Wallet balances for different tokens
 */
export const getWalletBalances = async (address: string): Promise<WalletData> => {
  try {
    // Mock implementation - would call blockchain RPC endpoints in a real app
    const nativeBalance = Math.random() * 10; // SOL

    const tokens = [
      {
        symbol: "SRUN",
        balance: Math.random() * 1000,
        usdValue: Math.random() * 2000,
        price: Math.random() * 5,
        change24h: (Math.random() * 20) - 10
      },
      {
        symbol: "AUTO",
        balance: Math.random() * 5000,
        usdValue: Math.random() * 1000,
        price: Math.random() * 0.5,
        change24h: (Math.random() * 20) - 10
      },
      {
        symbol: "TDX",
        balance: Math.random() * 10000,
        usdValue: Math.random() * 500,
        price: Math.random() * 0.1,
        change24h: (Math.random() * 20) - 10
      }
    ];

    const totalUsdValue = tokens.reduce((sum, token) => sum + token.usdValue, 0) + (nativeBalance * 100); // Assuming SOL is $100

    return {
      address,
      balance: nativeBalance,
      tokens,
      totalUsdValue
    };
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    toast({
      title: "Failed to fetch balances",
      description: "Could not retrieve wallet data. Please try again later.",
      variant: "destructive"
    });

    return {
      address,
      balance: 0,
      tokens: [],
      totalUsdValue: 0
    };
  }
};

/**
 * Signs and sends a transaction to the blockchain
 * @param transaction Transaction details
 * @returns Transaction result
 */
export const sendTransaction = async (transaction: any): Promise<any> => {
  // Mock implementation - would interact with wallet and blockchain in a real app
  try {
    const success = Math.random() > 0.1; // 90% success rate
    const txHash = `${Math.random().toString(16).substr(2, 64)}`;

    if (!success) {
      throw new Error("Transaction failed: insufficient funds");
    }

    return {
      success,
      txHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      timestamp: new Date().toISOString(),
      gasUsed: Math.random() * 0.0001
    };
  } catch (error) {
    console.error("Transaction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Checks if a wallet address is valid
 * @param address Wallet address to validate
 * @returns Whether the address is valid
 */
export const isValidWalletAddress = (address: string): boolean => {
  if (!address) return false;

  // Basic validation for Solana addresses
  return address.length === 44 || address.startsWith("S");
};

/**
 * Formats a wallet address for display
 * @param address Full wallet address
 * @param length Length of beginning and end parts
 * @returns Shortened wallet address
 */
export const formatWalletAddress = (address: string, length = 4): string => {
  if (!address) return '';

  // If address already contains "...", assume it's already formatted
  if (address.includes('...')) {
    return address;
  }

  const start = address.substring(0, length);
  const end = address.substring(address.length - length);

  return `${start}...${end}`;
};

/**
 * Alias for formatWalletAddress for backward compatibility
 */
export const truncateAddress = formatWalletAddress;

/**
 * Format a balance with appropriate units
 */
export const formatBalance = (balance: number, currency: string = 'SOL'): string => {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(2)}M ${currency}`;
  } else if (balance >= 1000) {
    return `${(balance / 1000).toFixed(2)}K ${currency}`;
  } else {
    return `${balance.toFixed(4)} ${currency}`;
  }
};

/**
 * Convert a value to a different currency
 */
export const convertToCurrency = (value: number, currency: string): number => {
  const rates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 150.56,
    KES: 129.45
  };

  return value * (rates[currency as keyof typeof rates] || 1);
};

/**
 * Get a color class based on a value's change
 */
export const getChangeColorClass = (change: number): string => {
  if (change > 0) return 'text-green-500';
  if (change < 0) return 'text-red-500';
  return 'text-gray-400';
};

/**
 * Format a percentage change with + or - sign
 */
export const formatPercentageChange = (change: number): string => {
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

/**
 * Creates a signature for a message using the connected wallet
 * @param message Message to sign
 * @param walletAddress Wallet address to sign with
 * @returns Signature and related information
 */
export const signMessage = async (message: string, walletAddress: string): Promise<any> => {
  // Mock implementation - would use actual wallet signature in a real app
  try {
    return {
      message,
      signer: walletAddress,
      signature: `${Math.random().toString(16).substr(2, 130)}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Signature error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign message"
    };
  }
};
