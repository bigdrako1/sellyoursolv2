
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  connectWallet,
  disconnectWallet,
  getConnectedWallet
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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );
    
    // Check for connected wallet on mount
    const savedWallet = getConnectedWallet();
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      
      // Generate a unique identifier for the wallet that is email-compatible
      const sanitizedWalletAddress = walletAddress?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
      const email = `user_${sanitizedWalletAddress}@solana-wallet.app`;
      
      // Try sign in first
      let { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password: "wallet-auth-placeholder" 
      });
      
      // If user doesn't exist, sign up
      if (error && error.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: "wallet-auth-placeholder",
          options: {
            data: {
              wallet_address: walletAddress
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        // After signup, attempt login again
        const { error: retryError } = await supabase.auth.signInWithPassword({ 
          email, 
          password: "wallet-auth-placeholder" 
        });
        
        if (retryError) throw retryError;
      } else if (error) {
        throw error;
      }
      
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
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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
      isAuthenticated: !!user,
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
