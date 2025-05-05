
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Key, Lock, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { APP_CONFIG } from "@/config/appDefinition";
import { formatWalletAddress, detectPhantomWallet } from "@/utils/phantomUtils";

const Auth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isDetectingWallet, setIsDetectingWallet] = useState(true);
  const { toast } = useToast();
  const { signIn, isAuthenticated, walletAddress, isPhantomInstalled } = useAuth();
  const navigate = useNavigate();
  
  // Detect wallet on component mount
  useEffect(() => {
    const checkWalletStatus = async () => {
      setIsDetectingWallet(true);
      try {
        const isDetected = await detectPhantomWallet();
        console.log("Phantom wallet detection:", isDetected);
      } catch (error) {
        console.error("Error detecting wallet:", error);
      } finally {
        setIsDetectingWallet(false);
      }
    };
    
    checkWalletStatus();
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to home");
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
      console.log("Initiating sign in process");
      const result = await signIn();
      console.log("Sign in result:", result);
      
      toast({
        title: "Authentication Successful",
        description: "You're now logged in to the platform",
      });
      navigate('/');
    } catch (error) {
      console.error("Authentication failed:", error);
      // Error is handled in the signIn function
    } finally {
      setIsConnecting(false);
    }
  };

  const openPhantomWebsite = () => {
    window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
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
              {isDetectingWallet ? (
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Detecting Wallet</h4>
                    <p className="text-sm text-gray-300">
                      Checking for Phantom wallet extension...
                    </p>
                  </div>
                </div>
              ) : !isPhantomInstalled ? (
                <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-400 mb-1">Phantom Wallet Not Detected</h4>
                    <p className="text-sm text-gray-300">
                      You need to install the Phantom browser extension to connect your wallet.
                    </p>
                    <Button 
                      variant="link" 
                      className="text-red-400 p-0 h-auto mt-2 flex items-center" 
                      onClick={openPhantomWebsite}
                    >
                      Download Phantom Wallet
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : walletAddress ? (
                <div className="bg-trading-dark/40 p-4 rounded-md mb-4">
                  <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                  <div className="font-mono text-trading-highlight flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    {formatWalletAddress(walletAddress, 6)}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Sign a secure message to complete authentication
                  </p>
                </div>
              ) : null}
              
              <Button
                onClick={handleWalletConnect}
                className="w-full trading-button"
                disabled={isConnecting || (!isPhantomInstalled && !isDetectingWallet)}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                    {walletAddress ? "Signing Message..." : "Connecting..."}
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
            
            {/* Added security explanation */}
            {walletAddress && !isAuthenticated && (
              <div className="bg-trading-highlight/10 border border-trading-highlight/20 rounded-md p-3 text-sm">
                <h4 className="font-medium text-trading-highlight mb-1">Secure Authentication</h4>
                <p className="text-gray-300 text-xs">
                  We use wallet signatures for secure, passwordless authentication. This doesn't 
                  grant any transaction permissions — we only verify you own this wallet.
                </p>
              </div>
            )}
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
