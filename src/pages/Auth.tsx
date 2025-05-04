
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  const handleWalletConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsConnecting(true);
    try {
      await signIn();
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
            <CardTitle className="text-3xl font-bold trading-gradient-text">SellYourSOL™ v2</CardTitle>
            <CardDescription className="text-gray-400">
              Connect your Solana wallet to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="mb-6">
              <p className="text-center text-sm text-gray-300 mb-8">
                Authentication is only available through Solana wallet connection. Please connect your wallet to access the trading platform.
              </p>
              
              <Button
                onClick={handleWalletConnect}
                className="w-full trading-button"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 pt-0">
            <p className="text-xs text-center text-gray-400 mt-4">
              By continuing, you agree to SellYourSOL's Terms of Service and Privacy Policy.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
