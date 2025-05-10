import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
import {
  createSession,
  getSession,
  extendSession,
  removeSession,
  isSessionValid,
  SESSION_TIMEOUT_MS
} from '@/utils/sessionUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (walletName?: string) => Promise<void>;
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
  const sessionTimeoutRef = useRef<number | null>(null);

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

  // Function to set up session timeout
  const setupSessionTimeout = () => {
    // Clear any existing timeout
    if (sessionTimeoutRef.current) {
      window.clearTimeout(sessionTimeoutRef.current);
    }

    // Set new timeout
    sessionTimeoutRef.current = window.setTimeout(() => {
      // Session expired, show notification
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please sign in again.",
        variant: "destructive",
      });

      // Sign out user
      signOut();
    }, SESSION_TIMEOUT_MS);
  };

  // Function to refresh session
  const refreshSession = () => {
    if (isAuthenticated) {
      // Extend session
      extendSession();

      // Reset timeout
      setupSessionTimeout();
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

    // Check for valid session
    const session = getSession();
    if (session) {
      // Session exists and is valid
      try {
        // Load user data from localStorage if available
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setWalletAddress(session.walletAddress);
          setWalletProvider(session.walletProvider);
          setIsAuthenticated(true);

          // Set up session timeout
          setupSessionTimeout();
        }
      } catch (e) {
        console.error("Failed to parse stored user data:", e);
        removeSession();
        localStorage.removeItem('user');
      }
    }

    setLoading(false);

    // Set up event listeners for activity to refresh session
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      refreshSession();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Clean up
    return () => {
      if (sessionTimeoutRef.current) {
        window.clearTimeout(sessionTimeoutRef.current);
      }

      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, []);

  const signIn = async (walletName?: string) => {
    try {
      setLoading(true);
      console.log("SignIn called with wallet name:", walletName);

      // Check for available wallets
      await refreshWalletsStatus();

      // Check if wallets are available
      if (!walletsDetected && installedWallets.length === 0) {
        throw new Error("No Solana wallets detected. Please install a Solana wallet extension");
      }

      // Determine which wallet to use
      let walletToUse = walletName;

      if (!walletToUse && installedWallets.length > 0) {
        // If no wallet specified but we have installed wallets, use the first one
        walletToUse = installedWallets[0].name;
      } else if (!walletToUse) {
        throw new Error("Please specify a wallet to connect or install a Solana wallet extension");
      }

      // Connect to wallet
      const result = await connectWallet(walletToUse);

      if (!result.success || !result.address) {
        throw new Error(result.error || "Failed to connect to wallet");
      }

      // Set the wallet address
      setWalletAddress(result.address);
      setWalletProvider(result.walletName || walletToUse);

      // Generate a timestamp and nonce for the message
      const timestamp = new Date().getTime();
      const nonce = Math.floor(Math.random() * 1000000).toString();

      // Create a unique message for the user to sign with their wallet
      const message = `Sign this message to authenticate with SellYourSol: ${timestamp}-${nonce}`;

      // Request signature from wallet
      const signResult = await signMessage(message);

      if (!signResult.success || !signResult.signature) {
        throw new Error(signResult.error || "Failed to sign message with wallet");
      }

      // Verify the signature
      const isValid = await verifyWalletSignature(
        result.address,
        message,
        signResult.signature
      );

      if (!isValid) {
        throw new Error("Invalid signature. Authentication failed");
      }

      // Create a simple user object with the wallet data
      const userData = {
        id: result.address,
        wallet_address: result.address,
        wallet_provider: result.walletName || walletToUse,
        auth_method: "wallet_signature",
        timestamp: timestamp
      };

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      // Create a new session with extended timeout (7 days)
      createSession(
        result.address,
        result.address,
        result.walletName || walletToUse,
        7 * 24 * 60 * 60 * 1000 // 7 days
      );

      // Set up session timeout
      setupSessionTimeout();

      // Set the user state
      setUser(userData as any);
      setIsAuthenticated(true);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.walletName || walletToUse}`,
        variant: "default",
      });

      return result;
    } catch (error: any) {
      console.error("Authentication error:", error);

      // Clean up any partial connection state
      if (walletAddress) {
        await disconnectWallet();
        setWalletAddress(null);
        setWalletProvider(null);
      }

      toast({
        title: "Connection Failed",
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

      // Clear session timeout
      if (sessionTimeoutRef.current) {
        window.clearTimeout(sessionTimeoutRef.current);
        sessionTimeoutRef.current = null;
      }

      // Disconnect wallet
      const success = await disconnectWallet();
      if (!success) {
        throw new Error("Failed to disconnect wallet");
      }
      setWalletAddress(null);
      setWalletProvider(null);

      // Clear user data from localStorage
      localStorage.removeItem('user');

      // Remove session
      removeSession();

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
