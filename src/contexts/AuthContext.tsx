import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  connectPhantomWallet,
  disconnectWallet,
  getConnectedWallet,
  signWithPhantom,
  detectPhantomWallet, 
  verifyWalletSignature 
} from '@/utils/phantomUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  walletAddress: string | null;
  isPhantomInstalled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Phantom wallet is installed
    const checkPhantom = async () => {
      const hasPhantom = await detectPhantomWallet();
      setIsPhantomInstalled(hasPhantom);
    };
    
    checkPhantom();
    
    // Check for connected wallet on mount
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
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

  const signIn = async () => {
    try {
      setLoading(true);
      
      // Check if Phantom is installed
      if (!isPhantomInstalled) {
        throw new Error("Phantom wallet is not installed. Please install the Phantom browser extension");
      }
      
      // If the wallet is not connected yet, connect it using Phantom
      if (!walletAddress) {
        try {
          // Connect to Phantom wallet
          const result = await connectPhantomWallet();
          
          if (result.success && result.address) {
            // Set the wallet address
            setWalletAddress(result.address);
            
            // Store wallet address for persistence
            localStorage.setItem('walletAddress', result.address);
            localStorage.setItem('walletProvider', 'phantom');
            
            // Show toast notification that wallet was connected
            toast({
              title: "Wallet Connected",
              description: `Connected to wallet: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
            });
          } else {
            throw new Error(result.error || "Failed to connect to wallet");
          }
        } catch (err) {
          if (err instanceof Error && err.message.includes('User rejected')) {
            throw new Error("Wallet connection was rejected by user");
          }
          throw new Error("Failed to connect to Phantom wallet");
        }
      }
      
      // Generate a timestamp and nonce for the message
      const timestamp = new Date().getTime();
      const nonce = Math.floor(Math.random() * 1000000).toString();
      
      // Create a unique message for the user to sign with their wallet
      const message = `Sign this message to authenticate with Token Monitor: ${timestamp}-${nonce}`;
      
      try {
        // Have the user sign the message with their wallet
        const signResult = await signWithPhantom(message);
        
        if (!signResult.success || !signResult.signature) {
          throw new Error(signResult.error || "Failed to sign message");
        }
        
        // Verify the signature
        const isValid = await verifyWalletSignature(
          walletAddress as string,
          message,
          signResult.signature
        );
        
        if (!isValid) {
          throw new Error("Signature verification failed");
        }
        
        // Create a simple user object with the wallet data
        const userData = {
          id: walletAddress,
          wallet_address: walletAddress,
          auth_method: "wallet_signature",
          signature: signResult.signature,
          timestamp: timestamp,
          nonce: nonce
        };
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Set the user state
        setUser(userData as any);
        setIsAuthenticated(true);
        
        toast({
          title: "Authentication Successful",
          description: "Successfully authenticated with wallet",
          variant: "default",
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes('User rejected')) {
          throw new Error("Message signing was rejected by user");
        }
        throw err;
      }
    } catch (error: any) {
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
      isPhantomInstalled,
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
