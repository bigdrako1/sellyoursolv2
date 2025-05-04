
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Key, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/appDefinition";

const Auth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { signIn, isAuthenticated, walletAddress } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // If wallet is connected but not authenticated, we should show a message
    if (walletAddress && !isAuthenticated) {
      toast({
        title: "Wallet Connected",
        description: "Please complete wallet authentication to access the platform",
      });
    }
  }, [walletAddress, isAuthenticated, toast]);
  
  const handleWalletConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsConnecting(true);
    try {
      await signIn();
      toast({
        title: "Authentication Successful",
        description: "You're now logged in to the platform",
      });
      navigate('/');
    } catch (error) {
      // Error is handled in the signIn function
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-trading-dark">
      <div className="flex-grow flex justify-center items-center p-6">
        <Card className="w-full max-w-md bg-trading-darkAccent border-trading-highlight/20">
          <CardHeader className="text-center">
            <div className="w-full flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-trading-highlight/20 flex items-center justify-center">
                <Lock className="h-8 w-8 text-trading-highlight" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold trading-gradient-text">{APP_CONFIG.name}</CardTitle>
            <CardDescription className="text-gray-400">
              {walletAddress ? "Complete authentication to access the platform" : "Connect your Solana wallet to access the platform"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="mb-6">          
              {walletAddress ? (
                <div className="bg-trading-dark/40 p-4 rounded-md mb-4">
                  <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                  <div className="font-mono text-trading-highlight flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    {walletAddress}
                  </div>
                </div>
              ) : null}
              
              <Button
                onClick={handleWalletConnect}
                className="w-full trading-button"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    Authenticating...
                  </>
                ) : (
                  <>
                    {walletAddress ? (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Sign Message to Authenticate
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Connect Phantom Wallet
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <p className="text-xs text-center text-gray-400 mt-4">
              By connecting your wallet, you agree to {APP_CONFIG.name}'s Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
