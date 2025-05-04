
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  signMessage
} from '@/utils/walletUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  walletAddress: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
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

  // Store authenticated state in a local variable to avoid localStorage access on every render
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const signIn = async () => {
    try {
      setLoading(true);
      
      // If the wallet is not connected yet, connect it
      if (!walletAddress) {
        const result = await connectWallet("Phantom");
        if (!result.success) {
          throw new Error(result.error || "Failed to connect wallet");
        }
        setWalletAddress(result.address);
      }
      
      // Generate a timestamp for the message
      const timestamp = new Date().getTime();
      
      // Create a unique message for the user to sign with their wallet
      const message = `Authenticate to Trading Bot: ${timestamp}`;
      
      // Have the user sign the message with their wallet
      const signResult = await signMessage(message, walletAddress);
      
      if (!signResult || signResult.error) {
        throw new Error(signResult?.error || "Failed to sign message with wallet");
      }
      
      // Create a simple user object with the wallet data
      const userData = {
        id: walletAddress,
        wallet_address: walletAddress,
        auth_method: "wallet_signature",
        signature: signResult.signature,
        timestamp: timestamp,
      };
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set the user state
      setUser(userData as any);
      setIsAuthenticated(true);
      
      toast({
        title: "Wallet Connected",
        description: "Successfully authenticated with wallet",
      });
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
