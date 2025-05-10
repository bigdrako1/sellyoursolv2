import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  signMessage,
  detectWallets,
  verifyWalletSignature,
  WalletProviderInfo
} from '@/utils/solanaWalletUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (walletName?: string) => Promise<{ address?: string } | undefined>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  walletAddress: string | null;
  walletProvider: string | null;
  walletsDetected: boolean;
  installedWallets: WalletProviderInfo[];
  loadableWallets: WalletProviderInfo[];
  detectingWallets: boolean;
  refreshWalletsStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<string | null>(null);
  const [walletsDetected, setWalletsDetected] = useState<boolean>(false);
  const [detectingWallets, setDetectingWallets] = useState<boolean>(true);
  const [installedWallets, setInstalledWallets] = useState<WalletProviderInfo[]>([]);
  const [loadableWallets, setLoadableWallets] = useState<WalletProviderInfo[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Function to refresh wallets status
  const refreshWalletsStatus = async () => {
    setDetectingWallets(true);
    try {
      const result = await detectWallets();

      setWalletsDetected(result.available);
      setInstalledWallets(result.installedWallets);
      setLoadableWallets(result.loadableWallets);
    } catch (error) {
      console.error("Error detecting wallets:", error);
      setWalletsDetected(false);
    } finally {
      setDetectingWallets(false);
    }
  };

  useEffect(() => {
    // Check for Solana wallets
    refreshWalletsStatus();

    // Check for connected wallet on mount
    const savedWallet = getConnectedWallet();
    if (savedWallet.address) {
      setWalletAddress(savedWallet.address);
      setWalletProvider(savedWallet.provider);
    }

    // Load user data from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const signIn = async (walletName?: string): Promise<{ address?: string } | undefined> => {
    try {
      setLoading(true);

      // Check for available wallets
      await refreshWalletsStatus();

      // Check if wallets are available
      if (!walletsDetected && installedWallets.length === 0) {
        console.error("No Solana wallets detected");
        throw new Error("No Solana wallets detected. Please install a Solana wallet extension");
      }

      // Step 1: Connect to wallet (if not already connected)
      let connectedAddress = walletAddress;

      if (!connectedAddress) {
        try {
          // If a specific wallet was requested, use that one
          let walletToUse = walletName;

          // If no specific wallet was requested, use the first detected wallet
          if (!walletToUse && installedWallets.length > 0) {
            walletToUse = installedWallets[0].name;
          }

          if (!walletToUse) {
            throw new Error("No wallet specified and no wallets detected");
          }

          // Connect to wallet
          console.log(`Connecting to wallet: ${walletToUse}`);
          const result = await connectWallet(walletToUse);

          if (result.success && result.address) {
            // Set the wallet address
            console.log("Wallet connected:", result);
            connectedAddress = result.address;
            setWalletAddress(result.address);
            setWalletProvider(result.walletName || walletToUse);

            // We don't show a toast here anymore since we'll show a combined one after authentication
          } else {
            console.error("Connection failed:", result.error);
            throw new Error(result.error || "Failed to connect to wallet");
          }
        } catch (err) {
          console.error("Error in wallet connection:", err);
          if (err instanceof Error && err.message.includes('User rejected')) {
            throw new Error("Wallet connection was rejected by user");
          }
          throw new Error(`Failed to connect to wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Step 2: Authenticate with signature (combined with connection)
      // Generate a timestamp and nonce for the message
      const timestamp = new Date().getTime();
      const nonce = Math.floor(Math.random() * 1000000).toString();

      // Create a unique message for the user to sign with their wallet
      const message = `Sign this message to authenticate with SellYourSOL V2: ${timestamp}-${nonce}`;

      try {
        console.log("Requesting signature for message:", message);
        // Have the user sign the message with their wallet
        const signResult = await signMessage(message);

        if (!signResult.success || !signResult.signature) {
          console.error("Signature failed:", signResult.error);
          throw new Error(signResult.error || "Failed to sign message");
        }

        console.log("Message signed successfully, verifying signature...");
        // Verify the signature
        const isValid = await verifyWalletSignature(
          connectedAddress as string,
          message,
          signResult.signature
        );

        if (!isValid) {
          console.error("Signature verification failed");
          throw new Error("Signature verification failed");
        }

        console.log("Signature verified successfully");
        // Create a simple user object with the wallet data
        const userData = {
          id: connectedAddress,
          wallet_address: connectedAddress,
          wallet_provider: walletProvider,
          auth_method: "wallet_signature",
          signature: Array.from(signResult.signature),
          timestamp: timestamp,
          nonce: nonce
        };

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        // Set the user state
        setUser(userData as any);
        setIsAuthenticated(true);

        // Show a combined toast for both connection and authentication
        toast({
          title: "Wallet Connected & Authenticated",
          description: `Connected to ${walletProvider}: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`,
          variant: "default",
        });

        // Return the connected address
        return { address: connectedAddress };
      } catch (err) {
        console.error("Error in message signing:", err);
        if (err instanceof Error && err.message.includes('User rejected')) {
          throw new Error("Message signing was rejected by user");
        }
        throw err;
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Disconnect wallet
      const success = await disconnectWallet();
      if (!success) {
        throw new Error("Failed to disconnect wallet");
      }
      setWalletAddress(null);
      setWalletProvider(null);

      // Clear user data from localStorage
      localStorage.removeItem('user');

      // Reset state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);

      toast({
        title: "Signed Out",
        description: "Successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut,
      isAuthenticated,
      walletAddress,
      walletProvider,
      walletsDetected,
      installedWallets,
      loadableWallets,
      detectingWallets,
      refreshWalletsStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
